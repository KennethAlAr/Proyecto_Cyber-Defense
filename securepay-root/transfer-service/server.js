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

// Transfer endpoint with basic validation and SQL parameterization
app.post('/transfer', async (req, res) => {
  const { from_id, to_id, amount } = req.body;
  if (!from_id || !to_id || !amount) return res.status(400).json({ error: 'missing fields' });
  const a = Number(amount);
  if (!Number.isFinite(a) || a <= 0) return res.status(400).json({ error: 'invalid amount' });
  try {
    await pool.query('BEGIN');
    const from = await pool.query('SELECT balance FROM users WHERE id = $1 FOR UPDATE', [from_id]);
    const to = await pool.query('SELECT balance FROM users WHERE id = $1 FOR UPDATE', [to_id]);
    if (from.rows.length === 0 || to.rows.length === 0) throw new Error('user not found');
    if (Number(from.rows[0].balance) < a) throw new Error('insufficient funds');
    await pool.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [a, from_id]);
    await pool.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [a, to_id]);
    await pool.query('COMMIT');
    // Emit audit event (best-effort)
    try { await fetch('http://audit-logs:3002/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'transfer', from_id, to_id, amount: a, ts: Date.now() }) }); } catch (e) {}
    res.json({ status: 'ok' });
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  }
});

app.listen(3001, () => console.log('Transfer service listening on 3001'));
