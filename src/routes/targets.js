const express = require('express');
const { supabaseAdmin, requireAuth } = require('../middleware/auth');

const router = express.Router();

const ACTIVITY_MULTIPLIERS = {
  sedentary:   1.2,
  light:       1.375,
  moderate:    1.55,
  active:      1.725,
  very_active: 1.9,
};

// Shared: calculate and upsert daily targets from a profile row.
// profileOverride: optional object with sex, age, height_in, weight_lbs, goal, activity_level (use after profile update to avoid re-read).
async function recalcTargets(userId, profileOverride = null) {
  let profile = profileOverride;
  if (!profile) {
    const { data, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('sex, age, height_in, weight_lbs, goal, activity_level')
      .eq('user_id', userId)
      .single();
    if (profileErr) return { error: profileErr.message };
    profile = data;
  }
  if (!profile || !profile.sex || !profile.age || !profile.height_in || !profile.weight_lbs) {
    return { error: 'Profile incomplete — need sex, age, height_in, weight_lbs' };
  }

  const weightKg = profile.weight_lbs * 0.453592;
  const heightCm = profile.height_in * 2.54;

  let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * profile.age);
  bmr += profile.sex === 'male' ? 5 : -161;

  const multiplier = ACTIVITY_MULTIPLIERS[profile.activity_level] || 1.55;
  let tdee = Math.round(bmr * multiplier);

  const goal = profile.goal || 'maintain';
  if (goal === 'bulk') tdee += 400;
  if (goal === 'cut') tdee -= 500;

  const protein_g = Math.round(weightKg * (goal === 'bulk' ? 2.2 : goal === 'cut' ? 2.0 : 1.8));
  const fat_g = Math.round((tdee * 0.25) / 9);
  const carbs_g = Math.round((tdee - (protein_g * 4) - (fat_g * 9)) / 4);

  const { data, error } = await supabaseAdmin
    .from('daily_targets')
    .upsert(
      { user_id: userId, calorie_target: tdee, protein_g, carbs_g, fat_g, calculated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error) return { error: error.message };
  return { targets: data };
}

// POST /api/targets — calculate and store daily calorie/macro targets
router.post('/', requireAuth, async (req, res) => {
  const result = await recalcTargets(req.user.id);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result);
});

// GET /api/targets — get current daily targets
router.get('/', requireAuth, async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('daily_targets')
    .select('*')
    .eq('user_id', req.user.id)
    .order('calculated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ targets: data || null });
});

module.exports = { router, recalcTargets };
