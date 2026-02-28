const express = require('express');
const { DINING_HALL_INFO, getDiningHallInfo } = require('../config/diningHalls');

const router = express.Router();

// GET /api/dining-halls
router.get('/', (req, res) => {
  res.json({ dining_halls: DINING_HALL_INFO });
});

// GET /api/dining-halls/:id
router.get('/:id', (req, res) => {
  const hall = getDiningHallInfo(req.params.id);
  if (!hall) {
    return res.status(404).json({ error: `Dining hall '${req.params.id}' not found` });
  }
  res.json(hall);
});

module.exports = router;
