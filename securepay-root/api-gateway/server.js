const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
app.use(express.json());

// Simple auth check middleware
app.use((req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'missing authorization' });
  // In real system validate JWT properly (delegated to auth-service)
  next();
});

// Proxy rules (minimal): forward /auth/* to auth-service, /transfer/* to transfer-service, /audit/* to audit-logs
app.all('/auth/*', async (req, res) => {
  const url = `http://auth-service:3000${req.path.replace('/auth', '')}`;
  const opts = { method: req.method, headers: { 'Content-Type': 'application/json' } };
  if (req.body) opts.body = JSON.stringify(req.body);
  const r = await fetch(url, opts);
  const body = await r.text();
  res.status(r.status).send(body);
});

app.all('/transfer/*', async (req, res) => {
  const url = `http://transfer-service:3001${req.path.replace('/transfer', '')}`;
  const opts = { method: req.method, headers: { 'Content-Type': 'application/json' } };
  if (req.body) opts.body = JSON.stringify(req.body);
  const r = await fetch(url, opts);
  const body = await r.text();
  res.status(r.status).send(body);
});

app.all('/audit/*', async (req, res) => {
  const url = `http://audit-logs:3002${req.path.replace('/audit', '')}`;
  const opts = { method: req.method, headers: { 'Content-Type': 'application/json' } };
  if (req.body) opts.body = JSON.stringify(req.body);
  const r = await fetch(url, opts);
  const body = await r.text();
  res.status(r.status).send(body);
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(8080, () => console.log('API Gateway listening on 8080'));
