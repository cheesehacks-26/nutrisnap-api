// Goal-based macro weights (sum to 1.0 per row)
const GOAL_WEIGHTS = {
  bulk:     { calories: 0.15, protein: 0.55, carbs: 0.20, fat: 0.10 },
  cut:      { calories: 0.50, protein: 0.30, carbs: 0.10, fat: 0.10 },
  maintain: { calories: 0.25, protein: 0.30, carbs: 0.25, fat: 0.20 },
};

/**
 * Score a single food item (0–100).
 *
 * @param {object} food             - CanteenFoodItem from fetchMenu
 * @param {object} remaining        - { calories, protein_g, carbs_g, fat_g } left for the day
 * @param {string} goal             - 'bulk' | 'cut' | 'maintain'
 * @param {Set}    savedIds         - Set of food_id strings the user saved
 * @param {Map}    historyMap       - Map<food_id, { count, daysSinceLast }>
 * @param {Set}    [todayLoggedIds] - Set of food_id strings already logged today
 * @returns {number} score 0–100
 */
function scoreItem(food, remaining, goal, savedIds, historyMap, todayLoggedIds = new Set()) {
  const macroFit = calcMacroFit(food, remaining, goal);       // 0–50
  const goalBias = calcGoalBias(food, goal);                   // 0–20
  const familiarity = calcFamiliarity(food, savedIds);         // 0–10
  const learned = calcLearnedPreference(food, historyMap);     // 0–20
  // Mild variety nudge: downrank items already eaten today so users see fresh options
  const repeatPenalty = todayLoggedIds.has(String(food.food_id)) ? 15 : 0;

  return Math.round(Math.min(100, Math.max(0, macroFit + goalBias + familiarity + learned - repeatPenalty)));
}

// --- A. Macro Fit (max 50 pts) ---

function calcMacroFit(food, remaining, goal) {
  const weights = GOAL_WEIGHTS[goal] || GOAL_WEIGHTS.maintain;
  const n = food.nutrition;

  const macros = [
    { value: n.calories,  rem: remaining.calories,  weight: weights.calories },
    { value: n.g_protein, rem: remaining.protein_g,  weight: weights.protein },
    { value: n.g_carbs,   rem: remaining.carbs_g,    weight: weights.carbs },
    { value: n.g_fat,     rem: remaining.fat_g,      weight: weights.fat },
  ];

  let total = 0;
  for (const { value, rem, weight } of macros) {
    total += macroScore(value, rem) * weight;
  }

  return total * 50; // scale to 0–50
}

/**
 * Per-macro score: 0–1
 * - Sweet spot: food fills 15–60% of remaining → 1.0
 * - Below 15%: partial (proportional)
 * - 60–100%: slight taper
 * - Over 100%: penalty, 0 if overshoots by >50%
 */
function macroScore(value, remaining) {
  if (remaining <= 0) {
    // Already at/over target — any contribution is a penalty
    return value === 0 ? 0.5 : 0;
  }

  const ratio = value / remaining;

  if (ratio >= 0.15 && ratio <= 0.60) return 1.0;
  if (ratio < 0.15) return ratio / 0.15;              // linear ramp 0→1
  if (ratio <= 1.0) return 1.0 - (ratio - 0.60) * 0.5; // 1.0→0.8
  if (ratio <= 1.5) return Math.max(0, 0.8 - (ratio - 1.0) * 1.6); // 0.8→0
  return 0;
}

// --- B. Goal Bias (max 20 pts) ---

function calcGoalBias(food, goal) {
  const n = food.nutrition;

  if (goal === 'bulk') {
    // Reward protein density (g_protein per 100 cal)
    const density = n.calories > 0 ? (n.g_protein / n.calories) * 100 : 0;
    return Math.min(20, density * 2); // 10g protein per 100cal → 20 pts
  }

  if (goal === 'cut') {
    // Reward fiber, penalize fat
    const fiberBonus = Math.min(10, (n.g_fiber || 0) * 2);
    const fatPenalty = n.g_fat > 15 ? Math.min(10, (n.g_fat - 15) * 0.5) : 0;
    return Math.max(0, fiberBonus + 10 - fatPenalty);
  }

  // maintain — reward moderate protein density, penalise very high fat
  const densityM = n.calories > 0 ? (n.g_protein / n.calories) * 100 : 0;
  const proteinBonus = Math.min(10, densityM * 1.5);    // up to 10 pts
  const fatPenalty   = n.g_fat > 15 ? Math.min(8, (n.g_fat - 15) * 0.4) : 0;
  return Math.min(20, Math.max(0, 5 + proteinBonus - fatPenalty));
}

// --- C. Familiarity / Saved (max 10 pts) ---

function calcFamiliarity(food, savedIds) {
  return savedIds.has(String(food.food_id)) ? 10 : 0;
}

// --- D. Learned Preference (max 20 pts) ---

/**
 * Build a history map from meal_logs rows.
 * @param {Array} logs - rows from meal_logs (past 14 days), each with { food_id, logged_at }
 * @param {string} today - "YYYY-MM-DD"
 * @returns {Map<string, { count: number, daysSinceLast: number }>}
 */
function buildHistoryMap(logs, today) {
  const map = new Map();
  const todayMs = new Date(today + 'T12:00:00').getTime();

  for (const log of logs) {
    const fid = String(log.food_id);
    const logDate = new Date(log.logged_at).getTime();
    const daysSince = Math.max(0, (todayMs - logDate) / (1000 * 60 * 60 * 24));

    if (map.has(fid)) {
      const entry = map.get(fid);
      entry.count += 1;
      entry.daysSinceLast = Math.min(entry.daysSinceLast, daysSince);
    } else {
      map.set(fid, { count: 1, daysSinceLast: daysSince });
    }
  }

  return map;
}

function calcLearnedPreference(food, historyMap) {
  const fid = String(food.food_id);
  const entry = historyMap.get(fid);
  if (!entry) return 0;

  // Frequency: saturates at 5 logs → 10 pts
  const frequencyScore = Math.min(entry.count / 5, 1.0) * 10;

  // Recency: linear decay over 14 days → 10 pts
  const recencyScore = Math.max(0, 1 - entry.daysSinceLast / 14) * 10;

  return frequencyScore + recencyScore;
}

module.exports = { scoreItem, buildHistoryMap, GOAL_WEIGHTS };
