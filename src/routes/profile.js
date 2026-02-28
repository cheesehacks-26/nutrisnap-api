const express = require('express');
const { supabaseAdmin, requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/profile
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('user_id', req.user.id)
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ profile: data });
});

// PUT /api/profile
// body: { display_name, sex, age, height_in, weight_lbs, goal, activity_level, dietary_restrictions }
router.put('/', requireAuth, async (req, res) => {
  const { display_name, sex, age, height_in, weight_lbs, goal, activity_level, dietary_restrictions } = req.body;
  const updates = { updated_at: new Date().toISOString() };
  if (display_name         !== undefined) updates.display_name         = display_name;
  if (sex                  !== undefined) updates.sex                  = sex;
  if (age                  !== undefined) updates.age                  = age;
  if (height_in            !== undefined) updates.height_in            = height_in;
  if (weight_lbs           !== undefined) updates.weight_lbs           = weight_lbs;
  if (goal                 !== undefined) updates.goal                 = goal;
  if (activity_level       !== undefined) updates.activity_level       = activity_level;
  if (dietary_restrictions !== undefined) updates.dietary_restrictions = dietary_restrictions;

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(updates)
    .eq('user_id', req.user.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ profile: data });
});

module.exports = router;
