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

app.use(cors());
app.use(express.json({ limit: '10mb' }));

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
  res.json({ message: 'BadgerBite API' });
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
  console.log(`BadgerBite API running on port ${PORT}`);
  warmCache();
});
