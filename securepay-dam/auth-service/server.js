const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const helmet = require('helmet');

const app = express();
app.use(helmet());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'securepay',
  password: process.env.DB_PASSWORD || 'securepass',
  database: process.env.DB_NAME || 'securepay_db'
});

const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_secret';

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Register endpoint: create user with hashed password
app.post('/register',
  body('name').isString().isLength({ min: 1 }),
  body('password').isString().isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, password } = req.body;
    try {
      const exists = await pool.query('SELECT id FROM users WHERE name = $1', [name]);
      if (exists.rows.length > 0) return res.status(409).json({ error: 'user exists' });
      const hash = await bcrypt.hash(password, 10);
      const ins = await pool.query('INSERT INTO users (name, balance, password_hash) VALUES ($1, $2, $3) RETURNING id, name', [name, 0, hash]);
      res.status(201).json({ id: ins.rows[0].id, name: ins.rows[0].name });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Login endpoint: validate password and return JWT
app.post('/login',
  body('name').isString().isLength({ min: 1 }),
  body('password').isString().isLength({ min: 1 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, password } = req.body;
    try {
      const r = await pool.query('SELECT id, name, password_hash FROM users WHERE name = $1', [name]);
      if (r.rows.length === 0) return res.status(400).json({ error: 'invalid credentials' });
      const user = r.rows[0];
      if (!user.password_hash) return res.status(400).json({ error: 'no password set for user' });
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(400).json({ error: 'invalid credentials' });
      const token = jwt.sign({ sub: user.id, name: user.name }, JWT_SECRET, { expiresIn: '1h' });
      res.json({ token });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

app.get('/users', async (req, res) => {
  const { rows } = await pool.query('SELECT id, name, balance FROM users');
  res.json(rows);
});

app.listen(3000, () => console.log('Auth service listening on 3000'));
