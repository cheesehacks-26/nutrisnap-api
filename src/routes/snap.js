const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { fetchMenu } = require('../services/nutrislice');
const { identifyFood } = require('../services/vision');
const { DINING_HALLS, getTodayCT } = require('../config/diningHalls');

const VALID_MEALS = ['breakfast', 'lunch', 'dinner'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB base64 limit

router.post('/', requireAuth, async (req, res) => {
  try {
    const { image, hall, meal } = req.body;

    // Validate inputs
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'image (base64 string) is required' });
    }
    if (image.length > MAX_IMAGE_SIZE) {
      return res.status(400).json({ error: 'Image too large (max ~7.5 MB file)' });
    }
    if (!hall || !DINING_HALLS[hall]) {
      return res.status(400).json({ error: `Invalid hall. Valid: ${Object.keys(DINING_HALLS).join(', ')}` });
    }
    if (!meal || !VALID_MEALS.includes(meal)) {
      return res.status(400).json({ error: `Invalid meal. Valid: ${VALID_MEALS.join(', ')}` });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Vision service not configured (missing GEMINI_API_KEY)' });
    }

    const date = getTodayCT();

    // Step 1: Fetch today's menu for this hall/meal (cached — instant)
    const menuItems = await fetchMenu(hall, meal, date);

    if (menuItems.length === 0) {
      return res.status(404).json({ error: 'No menu available for this hall/meal today' });
    }

    // Step 2: Send image + menu context to Gemini Vision
    const { matchedIds, unmatchedDescription } = await identifyFood(image, menuItems, hall, meal);

    // Step 3: Look up matched items with full nutrition
    const menuMap = new Map(menuItems.map((item) => [item.food_id, item]));
    const matched = matchedIds
      .map((id) => menuMap.get(id))
      .filter(Boolean)
      .map((item) => ({
        food_id: item.food_id,
        name: item.name,
        nutrition: {
          calories: item.nutrition.calories,
          g_protein: item.nutrition.g_protein,
          g_carbs: item.nutrition.g_carbs,
          g_fat: item.nutrition.g_fat,
          g_fiber: item.nutrition.g_fiber,
          g_sugar: item.nutrition.g_sugar,
        },
        station: item.station,
        serving_size: item.serving_size,
        food_tags: item.food_tags,
      }));

    res.json({
      matched,
      unmatched_description: unmatchedDescription,
    });
  } catch (err) {
    console.error('Snap error:', err);

    if (err.message?.includes('JSON')) {
      return res.status(502).json({ error: 'Vision model returned invalid response — try again' });
    }

    res.status(500).json({ error: 'Failed to process food photo' });
  }
});

module.exports = router;
