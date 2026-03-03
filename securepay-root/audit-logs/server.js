const express = require('express');
const fs = require('fs-extra');
const path = require('path');

const app = express();
app.use(express.json());

const LOG_DIR = path.join(__dirname, 'logs');
fs.ensureDirSync(LOG_DIR);

app.post('/events', async (req, res) => {
  const evt = req.body;
  const line = JSON.stringify({ ...evt, received: Date.now() }) + '\n';
  await fs.appendFile(path.join(LOG_DIR, 'events.log'), line);
  res.json({ status: 'recorded' });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(3002, () => console.log('Audit logs listening on 3002'));
