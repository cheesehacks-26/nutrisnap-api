const express = require('express');
const router = express.Router();
const { requireAuth, supabaseAdmin } = require('../middleware/auth');
const { fetchMenu } = require('../services/nutrislice');
const { DINING_HALLS, DINING_HALL_INFO, getTodayCT } = require('../config/diningHalls');
const { scoreItem, buildHistoryMap } = require('../services/scorer');

const VALID_MEALS = ['breakfast', 'lunch', 'dinner'];

router.get('/', requireAuth, async (req, res) => {
  try {
    const meal = req.query.meal;
    const date = req.query.date || getTodayCT();

    if (!meal || !VALID_MEALS.includes(meal)) {
      return res.status(400).json({ error: `meal is required (${VALID_MEALS.join(', ')})` });
    }

    const userId = req.user.id;
    const requestedHall = req.query.hall;

    // --- Stage 1: Parallel data fetch ---
    // If a specific hall is requested, only fetch that one; otherwise all halls
    const hallIds = (requestedHall && DINING_HALLS[requestedHall])
      ? [requestedHall]
      : Object.keys(DINING_HALLS);

    const [menuResults, loggedTotals, targets, savedFoods, profile, mealHistory] =
      await Promise.all([
        // Fetch menus from all halls (each wrapped in try/catch)
        Promise.allSettled(
          hallIds.map(async (hallId) => {
            const items = await fetchMenu(hallId, meal, date);
            return { hallId, items };
          })
        ),

        // Today's logged macro totals
        supabaseAdmin
          .from('meal_logs')
          .select('calories, protein_g, carbs_g, fat_g')
          .eq('user_id', userId)
          .gte('logged_at', date + 'T00:00:00')
          .lt('logged_at', date + 'T23:59:59.999'),

        // Latest daily targets
        supabaseAdmin
          .from('daily_targets')
          .select('calorie_target, protein_g, carbs_g, fat_g')
          .eq('user_id', userId)
          .order('calculated_at', { ascending: false })
          .limit(1),

        // Saved food IDs
        supabaseAdmin
          .from('saved_foods')
          .select('food_id')
          .eq('user_id', userId),

        // User profile
        supabaseAdmin
          .from('profiles')
          .select('goal, dietary_restrictions')
          .eq('user_id', userId)
          .single(),

        // Meal history (past 14 days) for learning signal
        supabaseAdmin
          .from('meal_logs')
          .select('food_id, logged_at')
          .eq('user_id', userId)
          .gte('logged_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

    // Parse profile
    const goal = profile.data?.goal || 'maintain';
    const restrictions = (profile.data?.dietary_restrictions || []).map((r) => r.toLowerCase());

    // Map profile restriction keys → the food tag name (lowercased) that proves a food is safe.
    // Restrictions with no direct food-tag equivalent (no_fish, kosher, etc.) cannot be
    // enforced via tags and are silently skipped rather than incorrectly filtering everything out.
    const RESTRICTION_TO_TAG = {
      vegan:       'vegan',
      vegetarian:  'vegetarian',
      halal:       'halal',
      dairy_free:  'dairy-free',
      gluten_free: 'gluten-free',
      no_eggs:     'egg-free',
      no_soy:      'soy-free',
    };

    // Sum today's logged macros
    const logged = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
    if (loggedTotals.data) {
      for (const row of loggedTotals.data) {
        logged.calories += Number(row.calories) || 0;
        logged.protein_g += Number(row.protein_g) || 0;
        logged.carbs_g += Number(row.carbs_g) || 0;
        logged.fat_g += Number(row.fat_g) || 0;
      }
    }

    // Parse targets (fall back to reasonable defaults)
    const t = targets.data?.[0];
    const target = {
      calories: t?.calorie_target || 2000,
      protein_g: t?.protein_g || 150,
      carbs_g: t?.carbs_g || 250,
      fat_g: t?.fat_g || 65,
    };

    // Remaining macros for the day
    const remaining = {
      calories: Math.max(0, target.calories - logged.calories),
      protein_g: Math.max(0, target.protein_g - logged.protein_g),
      carbs_g: Math.max(0, target.carbs_g - logged.carbs_g),
      fat_g: Math.max(0, target.fat_g - logged.fat_g),
    };

    // Build saved IDs set
    const savedIds = new Set((savedFoods.data || []).map((r) => String(r.food_id)));

    // Build history map for learned preference
    const historyMap = buildHistoryMap(mealHistory.data || [], date);

    // Build today's logged food_id set (for repeat-item penalty)
    const todayLoggedIds = new Set(
      (mealHistory.data || [])
        .filter(log => log.logged_at >= date + 'T00:00:00')
        .map(log => String(log.food_id))
    );

    // --- Stage 2 & 3: Filter + Score, grouped by hall ---
    const halls = {};
    const seenFoodIds = new Set();

    for (const result of menuResults) {
      if (result.status !== 'fulfilled') continue;
      const { hallId, items } = result.value;
      if (!items || items.length === 0) continue;

      const hallInfo = DINING_HALL_INFO.find(h => h.id === hallId);
      const hallName = hallInfo?.shortName || hallId;

      const scored = [];
      for (const food of items) {
        // Skip BYO sub-components (individual breads, proteins, etc.)
        if (food.is_byo_component) continue;

        // Stage 2: Hard filter — only surface items that satisfy all dietary restrictions.
        // For each restriction that has a known food-tag equivalent, the food MUST carry
        // that tag (e.g. a gluten-free user only sees items tagged "Gluten-Free").
        // BYO items always pass because the user customises their own build.
        if (!food.is_build_your_own && restrictions.length > 0) {
          const tags = (food.food_tags || []).map((t) => t.toLowerCase());
          const isSafe = restrictions.every((r) => {
            const requiredTag = RESTRICTION_TO_TAG[r];
            if (!requiredTag) return true; // no tag equivalent — cannot filter, keep the item
            return tags.includes(requiredTag);
          });
          if (!isSafe) continue;
        }

        // Skip duplicates across halls (same food_id served at multiple locations)
        const fid = String(food.food_id);
        if (seenFoodIds.has(fid)) continue;

        // Stage 3: Score
        const score = scoreItem(food, remaining, goal, savedIds, historyMap, todayLoggedIds);

        scored.push({
          food_id: food.food_id,
          name: food.name,
          score,
          nutrition: {
            calories: food.nutrition.calories,
            g_protein: food.nutrition.g_protein,
            g_carbs: food.nutrition.g_carbs,
            g_fat: food.nutrition.g_fat,
          },
          station: food.station,
          serving_size: food.serving_size,
          food_tags: food.food_tags,
          is_saved: savedIds.has(String(food.food_id)),
          hall: hallId,
          hall_name: hallName,
        });
      }

      // Stage 4: Sort descending by score, keep top 5
      scored.sort((a, b) => b.score - a.score);
      const top = scored.slice(0, 5);

      // Mark these food_ids as seen so other halls won't duplicate them
      for (const item of top) seenFoodIds.add(String(item.food_id));

      if (top.length > 0) {
        halls[hallId] = top;
      }
    }

    res.json({
      meal,
      date,
      remaining,
      halls,
    });
  } catch (err) {
    console.error('Recommendation error:', err);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

module.exports = router;
