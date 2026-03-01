const express = require('express');
const { supabaseAdmin, requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/history?days=7
// Returns daily totals for calories and each macro over the past N days
router.get('/', requireAuth, async (req, res) => {
  const days = Math.min(parseInt(req.query.days) || 7, 30);
  const userId = req.user.id;

  // Build date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days + 1);

  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  const { data: logs, error } = await supabaseAdmin
    .from('meal_logs')
    .select('calories, protein_g, carbs_g, fat_g, logged_at')
    .eq('user_id', userId)
    .gte('logged_at', `${startStr}T00:00:00.000Z`)
    .lte('logged_at', `${endStr}T23:59:59.999Z`);

  if (error) return res.status(500).json({ error: error.message });

  // Group by date
  const byDate = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split('T')[0];
    byDate[key] = { date: key, calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
  }

  for (const log of logs) {
    const key = log.logged_at.split('T')[0];
    if (byDate[key]) {
      byDate[key].calories  += Number(log.calories)  || 0;
      byDate[key].protein_g += Number(log.protein_g) || 0;
      byDate[key].carbs_g   += Number(log.carbs_g)   || 0;
      byDate[key].fat_g     += Number(log.fat_g)     || 0;
    }
  }

  const history = Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));

  // Fetch targets for comparison
  const { data: targetRow } = await supabaseAdmin
    .from('daily_targets')
    .select('calorie_target, protein_g, carbs_g, fat_g')
    .eq('user_id', userId)
    .order('calculated_at', { ascending: false })
    .limit(1)
    .single();

  const targets = targetRow || { calorie_target: 2000, protein_g: 150, carbs_g: 250, fat_g: 65 };

  res.json({ days, history, targets });
});

module.exports = router;
