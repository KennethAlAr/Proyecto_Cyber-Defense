const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'securepay',
  password: process.env.DB_PASSWORD || 'securepass',
  database: process.env.DB_NAME || 'securepay_db'
});

const JWT_SECRET = process.env.JWT_SECRET || 'replace_this_secret';

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Minimal login that returns a JWT (for demo only)
app.post('/login', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'missing name' });
  // In a real system verify password; here we allow by name and create user if not exist
  const r = await pool.query('SELECT id, name FROM users WHERE name = $1', [name]);
  let user = r.rows[0];
  if (!user) {
    const ins = await pool.query('INSERT INTO users (name, balance) VALUES ($1, $2) RETURNING id, name', [name, 0]);
    user = ins.rows[0];
  }
  const token = jwt.sign({ sub: user.id, name: user.name }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

app.get('/users', async (req, res) => {
  const { rows } = await pool.query('SELECT id, name, balance FROM users');
  res.json(rows);
});

app.listen(3000, () => console.log('Auth service listening on 3000'));
