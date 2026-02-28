const express = require('express');
const { supabaseAdmin, requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/log
// body: { food_id, food_name, quantity, serving_size, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, hall, meal_type }
router.post('/', requireAuth, async (req, res) => {
  const { food_id, food_name, quantity, serving_size, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, hall, meal_type } = req.body;
  if (!food_name) return res.status(400).json({ error: 'food_name is required' });

  const { data, error } = await supabaseAdmin
    .from('meal_logs')
    .insert({
      user_id: req.user.id,
      food_id,
      food_name,
      quantity:   quantity   ?? 1,
      serving_size,
      calories:   calories   ?? 0,
      protein_g:  protein_g  ?? 0,
      carbs_g:    carbs_g    ?? 0,
      fat_g:      fat_g      ?? 0,
      fiber_g:    fiber_g    ?? 0,
      sugar_g:    sugar_g    ?? 0,
      sodium_mg:  sodium_mg  ?? 0,
      hall,
      meal_type,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ log: data });
});

// GET /api/log?date=YYYY-MM-DD
router.get('/', requireAuth, async (req, res) => {
  const { date } = req.query;

  let query = supabaseAdmin
    .from('meal_logs')
    .select('*')
    .eq('user_id', req.user.id)
    .order('logged_at', { ascending: true });

  if (date) {
    query = query
      .gte('logged_at', `${date}T00:00:00.000Z`)
      .lt('logged_at', `${date}T23:59:59.999Z`);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const totals = data.reduce(
    (acc, item) => {
      acc.calories  += Number(item.calories)  || 0;
      acc.protein_g += Number(item.protein_g) || 0;
      acc.carbs_g   += Number(item.carbs_g)   || 0;
      acc.fat_g     += Number(item.fat_g)     || 0;
      acc.fiber_g   += Number(item.fiber_g)   || 0;
      acc.sugar_g   += Number(item.sugar_g)   || 0;
      acc.sodium_mg += Number(item.sodium_mg) || 0;
      return acc;
    },
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, sugar_g: 0, sodium_mg: 0 }
  );

  res.json({ logs: data, totals });
});

// DELETE /api/log/:id
router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from('meal_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', req.user.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
