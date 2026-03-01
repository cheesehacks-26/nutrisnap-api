const express = require('express');
const { supabaseAdmin, requireAuth } = require('../middleware/auth');
const { getTodayCT } = require('../config/diningHalls');

const router = express.Router();

// GET /api/streak
// Returns current streak, longest streak, and whether the user has logged today
router.get('/', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const today = getTodayCT();

  // Fetch all distinct dates the user has logged meals (past 365 days max)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 365);

  const { data: logs, error } = await supabaseAdmin
    .from('meal_logs')
    .select('logged_at')
    .eq('user_id', userId)
    .gte('logged_at', cutoff.toISOString())
    .order('logged_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  // Extract unique dates (in Central Time)
  const uniqueDates = new Set();
  for (const log of logs) {
    const date = new Date(log.logged_at).toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    uniqueDates.add(date);
  }

  const sortedDates = [...uniqueDates].sort((a, b) => b.localeCompare(a)); // newest first

  const loggedToday = sortedDates[0] === today;

  // Calculate current streak starting from today (or yesterday if not logged today)
  let currentStreak = 0;
  let checkDate = new Date(today + 'T12:00:00');

  // If user hasn't logged today, start checking from yesterday
  if (!loggedToday) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dateStr = checkDate.toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    if (uniqueDates.has(dateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  const ascending = [...uniqueDates].sort();

  for (let i = 0; i < ascending.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prev = new Date(ascending[i - 1] + 'T12:00:00');
      const curr = new Date(ascending[i] + 'T12:00:00');
      const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
      tempStreak = diffDays === 1 ? tempStreak + 1 : 1;
    }
    longestStreak = Math.max(longestStreak, tempStreak);
  }

  res.json({
    current_streak: currentStreak,
    longest_streak: longestStreak,
    logged_today: loggedToday,
    total_days_logged: uniqueDates.size,
  });
});

module.exports = router;
