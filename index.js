require('dotenv').config();
const express = require('express');
const cors = require('cors');

const menuRoutes = require('./src/routes/menu');
const diningHallRoutes = require('./src/routes/diningHalls');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/menu', menuRoutes);
app.use('/api/dining-halls', diningHallRoutes);

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
});
