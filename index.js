require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { warmCache } = require('./src/services/nutrislice');
const menuRoutes = require('./src/routes/menu');
const diningHallRoutes = require('./src/routes/diningHalls');
const authRoutes = require('./src/routes/auth');
const profileRoutes = require('./src/routes/profile');
const recommendRoutes = require('./src/routes/recommend');
const logRoutes = require('./src/routes/log');
const savedFoodsRoutes = require('./src/routes/savedFoods');
const { router: targetsRoutes } = require('./src/routes/targets');
const snapRoutes = require('./src/routes/snap');
const historyRoutes = require('./src/routes/history');
const streakRoutes = require('./src/routes/streak');


const app = express();
const PORT = process.env.PORT || 3001;

const corsOptions = {
  origin: ['https://nutrisnap.06-divij-agarwal.workers.dev', 'http://localhost:5173'],
  credentials: true,
};
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json({ limit: '15mb' }));

app.use('/api/menu', menuRoutes);
app.use('/api/dining-halls', diningHallRoutes);
app.use('/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/log', logRoutes);
app.use('/api/recommend', recommendRoutes);
app.use('/api/saved-foods', savedFoodsRoutes);
app.use('/api/targets', targetsRoutes);
app.use('/api/snap', snapRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/streak', streakRoutes);

app.get('/', (req, res) => {
  const accept = (req.headers.accept || '').toLowerCase();
  if (accept.includes('application/json')) {
    return res.json({ message: 'NutriSnap API', docs: '/api/dining-halls, /api/menu, /auth/login, ...', health: '/health' });
  }
  res.set('Content-Type', 'text/html');
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>NutriSnap API</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 560px; margin: 2rem auto; padding: 0 1rem; color: #1a1a1a; line-height: 1.5; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #444; margin: 0.5rem 0; }
    a { color: #039b6f; }
    code { background: #f0f0f0; padding: 0.2em 0.4em; border-radius: 4px; font-size: 0.9em; }
    ul { margin: 0.5rem 0; padding-left: 1.25rem; }
  </style>
</head>
<body>
  <h1>NutriSnap API</h1>
  <p>Backend for NutriSnap: nutrition tracking, dining hall menus, and AI-powered food identification.</p>
  <p><a href="/health">Health check</a> · <a href="https://github.com/cheesehacks-26/nutrisnap-api" target="_blank" rel="noopener">GitHub repo</a></p>
  <p>Endpoints: <code>/auth</code>, <code>/api/profile</code>, <code>/api/menu</code>, <code>/api/log</code>, <code>/api/recommend</code>, <code>/api/snap</code>, and more. See the repo README for full docs.</p>
</body>
</html>
  `);
});


app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`NutriSnap API running on port ${PORT}`);
  warmCache();
});
