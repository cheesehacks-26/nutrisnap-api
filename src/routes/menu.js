const express = require('express');
const { fetchMenu } = require('../services/nutrislice');
const { DINING_HALLS, getTodayCT } = require('../config/diningHalls');

const router = express.Router();

const VALID_MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/menu?hall=&meal=&date=
// date is optional, defaults to today CT
router.get('/', async (req, res) => {
  const { hall, meal, date } = req.query;

  if (!hall) {
    return res.status(400).json({
      error: 'Missing required query param: hall',
      valid_halls: Object.keys(DINING_HALLS),
    });
  }
  if (!DINING_HALLS[hall]) {
    return res.status(400).json({
      error: `Unknown dining hall: '${hall}'`,
      valid_halls: Object.keys(DINING_HALLS),
    });
  }

  if (!meal) {
    return res.status(400).json({
      error: 'Missing required query param: meal',
      valid_meals: VALID_MEAL_TYPES,
    });
  }
  if (!VALID_MEAL_TYPES.includes(meal)) {
    return res.status(400).json({
      error: `Invalid meal type: '${meal}'`,
      valid_meals: VALID_MEAL_TYPES,
    });
  }

  const resolvedDate = resolveDate(date);
  if (!resolvedDate) {
    return res.status(400).json({
      error: `Invalid date format: '${date}'. Expected YYYY-MM-DD`,
    });
  }

  try {
    const allItems = await fetchMenu(hall, meal, resolvedDate);
    const items = allItems.filter(i => !i.is_byo_component);
    res.json({ hall, meal, date: resolvedDate, count: items.length, items });
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({
        error: 'Menu not found for the given dining hall, meal, and date',
      });
    }
    console.error('Nutrislice fetch error:', err.message);
    res.status(502).json({ error: 'Failed to fetch menu from Nutrislice' });
  }
});

function resolveDate(dateParam) {
  if (!dateParam) return getTodayCT();
  if (!DATE_REGEX.test(dateParam)) return null;
  return dateParam;
}

module.exports = router;
