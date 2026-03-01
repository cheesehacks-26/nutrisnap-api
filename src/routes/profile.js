const express = require('express');
const { supabaseAdmin, requireAuth } = require('../middleware/auth');
const { recalcTargets } = require('./targets');

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
// body: { name, display_name, sex, age, height_in, weight_lbs, goal, activity_level, dietary_restrictions }
router.put('/', requireAuth, async (req, res) => {
  const { name, display_name, sex, age, height_in, weight_lbs, goal, activity_level, dietary_restrictions } = req.body;
  const updates = { updated_at: new Date().toISOString() };
  if (name                   !== undefined) updates.name                   = name;
  if (display_name           !== undefined) updates.display_name             = display_name;
  if (sex                    !== undefined) updates.sex                      = sex;
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

  // Sync name/display_name to Auth user metadata so "Display name" shows in Supabase Authentication > Users
  const nameForAuth = updates.name ?? updates.display_name;
  if (nameForAuth !== undefined) {
    await supabaseAdmin.auth.admin.updateUserById(req.user.id, {
      user_metadata: {
        ...req.user.user_metadata,
        display_name: nameForAuth,
        full_name: nameForAuth,
      },
    });
  }

  // Auto-recalculate targets using the profile we just saved (so calculation always uses latest values)
  const macroFields = ['sex', 'age', 'height_in', 'weight_lbs', 'goal', 'activity_level'];
  const recalcResult = macroFields.some(f => req.body[f] !== undefined)
    ? await recalcTargets(req.user.id, data)
    : null;

  const payload = { profile: data };
  if (recalcResult?.error) payload.targets_error = recalcResult.error;
  if (recalcResult?.targets) payload.targets = recalcResult.targets;
  res.json(payload);
});

module.exports = router;
