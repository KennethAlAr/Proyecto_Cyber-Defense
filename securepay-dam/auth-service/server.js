const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'securepay',
  password: process.env.DB_PASSWORD || 'securepass',
  database: process.env.DB_NAME || 'securepay_db'
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/users', async (req, res) => {
  const { rows } = await pool.query('SELECT id, name, balance FROM users');
  res.json(rows);
});

app.listen(3000, () => console.log('Auth service listening on 3000'));
