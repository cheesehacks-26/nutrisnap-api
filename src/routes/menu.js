const express = require('express');
const { fetchMenu } = require('../services/nutrislice');
const { DINING_HALLS, getTodayCT } = require('../config/diningHalls');

const router = express.Router();

const VALID_MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const VALID_SORTS = ['default', 'station', 'cal_asc', 'cal_desc', 'protein'];

// GET /api/menu?hall=&meal=&date=&sort=&search=&station=&tags=
router.get('/', async (req, res) => {
  const { hall, meal, date, sort, search, station, tags } = req.query;

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
    const baseItems = allItems.filter(i => !i.is_byo_component);

    const stations = [...new Set(baseItems.map(i => i.station).filter(Boolean))];

    let items = baseItems;

    if (station && station !== 'All') {
      items = items.filter(i => i.station === station);
    }

    if (tags) {
      const EXCLUDE_MAP = {
        'Gluten-Free': 'Wheat',
        'Dairy-Free': 'Dairy',
        'Egg-Free': 'Egg',
        'Soy-Free': 'Soy',
      };
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      const includeTags = tagList.filter(t => !EXCLUDE_MAP[t]);
      const excludeAllergens = tagList.map(t => EXCLUDE_MAP[t]).filter(Boolean);

      if (includeTags.length > 0 || excludeAllergens.length > 0) {
        items = items.filter(i => {
          if (i.is_build_your_own) return true;
          const ft = i.food_tags || [];
          if (includeTags.length > 0 && !includeTags.every(t => ft.includes(t))) return false;
          if (excludeAllergens.length > 0 && excludeAllergens.some(a => ft.includes(a))) return false;
          return true;
        });
      }
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      items = items.filter(i => {
        if ((i.name || '').toLowerCase().includes(q)) return true;
        if ((i.station || '').toLowerCase().includes(q)) return true;
        if (i.byo_components) {
          return i.byo_components.some(cat =>
            cat.items.some(sub => sub.name.toLowerCase().includes(q))
          );
        }
        return false;
      });
    }

    const sortKey = VALID_SORTS.includes(sort) ? sort : 'default';
    switch (sortKey) {
      case 'station':
        items.sort((a, b) => (a.station || '').localeCompare(b.station || ''));
        break;
      case 'cal_asc':
        items.sort((a, b) => (a.nutrition?.calories ?? 0) - (b.nutrition?.calories ?? 0));
        break;
      case 'cal_desc':
        items.sort((a, b) => (b.nutrition?.calories ?? 0) - (a.nutrition?.calories ?? 0));
        break;
      case 'protein':
        items.sort((a, b) => (b.nutrition?.g_protein ?? 0) - (a.nutrition?.g_protein ?? 0));
        break;
    }

    res.json({ hall, meal, date: resolvedDate, count: items.length, stations, items });
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
