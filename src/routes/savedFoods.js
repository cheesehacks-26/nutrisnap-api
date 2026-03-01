const express = require('express');
const { supabaseAdmin, requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/saved-foods — save a food item
router.post('/', requireAuth, async (req, res) => {
  const { food_id, food_name, hall, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg } = req.body;
  if (!food_id || !food_name) return res.status(400).json({ error: 'food_id and food_name are required' });

  const { data, error } = await supabaseAdmin
    .from('saved_foods')
    .upsert(
      {
        user_id: req.user.id,
        food_id: String(food_id),
        food_name,
        hall,
        calories:   calories   ?? 0,
        protein_g:  protein_g  ?? 0,
        carbs_g:    carbs_g    ?? 0,
        fat_g:      fat_g      ?? 0,
        fiber_g:    fiber_g    ?? 0,
        sugar_g:    sugar_g    ?? 0,
        sodium_mg:  sodium_mg  ?? 0,
      },
      { onConflict: 'user_id,food_id' }
    )
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ saved: data });
});

// GET /api/saved-foods — list all saved foods
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('saved_foods')
    .select('*')
    .eq('user_id', req.user.id)
    .order('saved_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ saved_foods: data });
});

// DELETE /api/saved-foods/:food_id — unsave a food
router.delete('/:food_id', requireAuth, async (req, res) => {
  const { error } = await supabaseAdmin
    .from('saved_foods')
    .delete()
    .eq('user_id', req.user.id)
    .eq('food_id', req.params.food_id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;