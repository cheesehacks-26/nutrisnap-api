const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { fetchMenu } = require('../services/nutrislice');
const { identifyFood, isVisionConfigured } = require('../services/vision');
const { DINING_HALLS, getTodayCT } = require('../config/diningHalls');
const { supabaseAdmin, optionalAuth, requireAuth } = require('../middleware/auth');

const VALID_MEALS = ['breakfast', 'lunch', 'dinner'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB base64 limit

// Correction map thresholds — tune these as signal accumulates
const CORRECTION_MIN_COUNT      = 3;
const CORRECTION_MIN_CONFIDENCE = 0.70;

// ── Cost controls ─────────────────────────────────────────────────────────────
// Every Gemini call spends quota (free tier ≈ 250–1,000 req/day). Three guards:
//  1. Result cache  — same photo + hall + meal within RESULT_TTL is served from memory,
//                     so retries / double-taps / "re-analyze" cost nothing.
//  2. Per-user cap  — SNAP_DAILY_LIMIT (default 30/day) per user (or IP if anonymous).
//  3. Global cap    — SNAP_GLOBAL_DAILY_LIMIT (default 900/day) keeps the whole app
//                     under the free quota. Limits reset at midnight CT.
const RESULT_TTL_MS      = 10 * 60 * 1000;
const RESULT_CACHE_MAX   = 500;
const USER_DAILY_LIMIT   = parseInt(process.env.SNAP_DAILY_LIMIT || '30', 10);
const GLOBAL_DAILY_LIMIT = parseInt(process.env.SNAP_GLOBAL_DAILY_LIMIT || '900', 10);

const resultCache = new Map();                       // hash -> { at, value }
const usage = { day: null, global: 0, byKey: new Map() };

function takeQuota(key) {
  const today = getTodayCT();
  if (usage.day !== today) { usage.day = today; usage.global = 0; usage.byKey.clear(); }
  const mine = usage.byKey.get(key) || 0;
  if (usage.global >= GLOBAL_DAILY_LIMIT) return { ok: false, scope: 'global', remaining: USER_DAILY_LIMIT - mine };
  if (mine >= USER_DAILY_LIMIT)           return { ok: false, scope: 'user',   remaining: 0 };
  usage.global += 1;
  usage.byKey.set(key, mine + 1);
  return { ok: true, remaining: USER_DAILY_LIMIT - mine - 1 };
}

function refundQuota(key) {
  usage.global = Math.max(0, usage.global - 1);
  usage.byKey.set(key, Math.max(0, (usage.byKey.get(key) || 0) - 1));
}

function cacheGet(hash) {
  const hit = resultCache.get(hash);
  if (!hit) return null;
  if (Date.now() - hit.at > RESULT_TTL_MS) { resultCache.delete(hash); return null; }
  return hit.value;
}

function cacheSet(hash, value) {
  if (resultCache.size >= RESULT_CACHE_MAX) resultCache.delete(resultCache.keys().next().value); // drop oldest
  resultCache.set(hash, { at: Date.now(), value });
}

// ── POST /api/snap ────────────────────────────────────────────────────────────
// Analyze a food photo against today's dining hall menu.
// Auth is optional: authenticated users get a session_id back (used for corrections).
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { image, hall, meal, mimeType } = req.body;

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
    if (!isVisionConfigured()) {
      return res.status(503).json({ error: 'Vision service not configured (missing GCP service-account credentials)' });
    }

    const date = getTodayCT();

    // Step 1: Fetch today's menu (cached — near-instant)
    const allMenuItems = await fetchMenu(hall, meal, date);
    const menuItems = allMenuItems.filter(i => !i.is_byo_component);

    if (menuItems.length === 0) {
      return res.status(404).json({ error: 'No menu available for this hall/meal today' });
    }

    // Step 2: Call Gemini Vision — returns [{food_id, confidence}] it can see in the photo.
    // Cached by photo hash so retries are free; gated by daily quotas so we stay on the free tier.
    const quotaKey = req.user?.id || req.ip;
    const imageHash = crypto.createHash('sha256').update(image).update(`|${hall}|${meal}|${date}`).digest('hex');
    let visionResult = cacheGet(imageHash);
    let cached = !!visionResult;
    let snapsRemaining = null;

    if (!visionResult) {
      const gate = takeQuota(quotaKey);
      if (!gate.ok) {
        return res.status(429).json({
          error: gate.scope === 'user'
            ? `You've used today's ${USER_DAILY_LIMIT} photo scans — pick your items from the menu instead.`
            : 'Photo scanning is busy right now — pick your items from the menu instead.',
          manual_select: true,
          matched: [],
          snaps_remaining: gate.remaining,
        });
      }
      snapsRemaining = gate.remaining;
      try {
        visionResult = await identifyFood(image, menuItems, hall, meal, mimeType);
        cacheSet(imageHash, visionResult);
      } catch (visionErr) {
        refundQuota(quotaKey); // failed calls shouldn't eat the user's daily allowance
        throw visionErr;
      }
    }
    const { matches: rawMatches, unmatchedDescription, model } = visionResult;

    const menuMap = new Map(menuItems.map(i => [i.food_id, i]));

    // Step 3: Apply correction map — swap any food_id the model consistently gets wrong
    // at this hall with the item users actually meant. Confidence travels with the swap.
    // Falls back gracefully if no table exists yet (e.g. before the first migration is run).
    let matches = rawMatches.map(m => ({ ...m }));
    try {
      const { data: corrections } = await supabaseAdmin
        .from('snap_correction_map')
        .select('rejected_food_id, correct_food_id')
        .eq('hall', hall)
        .gte('confidence', CORRECTION_MIN_CONFIDENCE)
        .gte('correction_count', CORRECTION_MIN_COUNT);

      if (corrections?.length) {
        const corrMap = new Map(corrections.map(c => [String(c.rejected_food_id), String(c.correct_food_id)]));
        const best = new Map();
        for (const m of rawMatches) {
          const correctedStr = corrMap.get(String(m.food_id));
          const correctedId = correctedStr ? parseInt(correctedStr, 10) : null;
          // Only apply the swap if the corrected item is actually on today's menu
          const id = correctedId != null && menuMap.has(correctedId) ? correctedId : m.food_id;
          // Deduplicate in case two IDs mapped to the same correction (keep highest confidence)
          if (!best.has(id) || best.get(id) < m.confidence) best.set(id, m.confidence);
        }
        matches = [...best.entries()].map(([food_id, confidence]) => ({ food_id, confidence }));
      }
    } catch (corrErr) {
      // Non-fatal — table may not exist yet; proceed with raw matches
      console.warn('Correction map lookup skipped:', corrErr.message);
    }

    // Step 4: Build full item objects for the matched IDs
    const matched = matches
      .map(m => ({ item: menuMap.get(m.food_id), confidence: m.confidence }))
      .filter(x => x.item)
      .map(({ item, confidence }) => ({
        food_id:      item.food_id,
        name:         item.name,
        confidence,
        nutrition: {
          calories:   item.nutrition.calories,
          g_protein:  item.nutrition.g_protein,
          g_carbs:    item.nutrition.g_carbs,
          g_fat:      item.nutrition.g_fat,
          g_fiber:    item.nutrition.g_fiber,
          g_sugar:    item.nutrition.g_sugar,
          mg_sodium:  item.nutrition.mg_sodium,
        },
        station:      item.station,
        serving_size: item.serving_size,
        food_tags:    item.food_tags,
      }));

    // Step 5: Write snap session (authenticated users only — needed for corrections)
    let sessionId = null;
    if (req.user) {
      try {
        const { data: sessionData } = await supabaseAdmin
          .from('snap_sessions')
          .insert({
            user_id:         req.user.id,
            hall,
            meal,
            detected_labels: matched.map(m => ({ food_id: String(m.food_id), name: m.name, confidence: m.confidence })),
            matched_ids:     matched.map(m => String(m.food_id)),
          })
          .select('id')
          .single();
        sessionId = sessionData?.id ?? null;
      } catch (sessionErr) {
        // Non-fatal — corrections just won't be linkable to this snap
        console.warn('snap_sessions write failed:', sessionErr.message);
      }
    }

    res.json({
      matched,
      session_id:            sessionId,
      unmatched_description: unmatchedDescription,
      manual_select:         matched.length === 0,
      model,
      cached,
      snaps_remaining:       snapsRemaining,
    });
  } catch (err) {
    console.error('Snap error:', err);
    if (err instanceof SyntaxError || err.message?.includes('JSON')) {
      return res.status(502).json({ error: 'Vision model returned invalid response — try again' });
    }
    if (err.status === 429) {
      // Every model is on quota cooldown — degrade to manual selection instead of a hard failure
      return res.status(429).json({ error: 'Photo scanning is busy right now — pick your items from the menu instead.', manual_select: true, matched: [] });
    }
    if (err.status === 503) {
      // Billing / API key / model availability — surface the reason so it's fixable, not a mystery 500
      return res.status(503).json({ error: 'Vision service unavailable', detail: err.message });
    }
    res.status(500).json({ error: 'Failed to process food photo' });
  }
});

// ── POST /api/snap/correction ─────────────────────────────────────────────────
// Explicit user correction: "this dish was actually X, not what you showed me."
// Fired client-side in the background — never blocks the UI.
router.post('/correction', requireAuth, async (req, res) => {
  const {
    snap_session_id,
    rejected_food_id,   // what Gemini returned (may be null if no match was shown)
    correct_food_id,
    correct_name,
    hall,
    meal,
  } = req.body;

  if (!correct_food_id || !correct_name || !hall) {
    return res.status(400).json({ error: 'correct_food_id, correct_name, and hall are required' });
  }

  // Verify the snap_session_id belongs to this user before linking it
  if (snap_session_id) {
    const { data: session } = await supabaseAdmin
      .from('snap_sessions')
      .select('id')
      .eq('id', snap_session_id)
      .eq('user_id', req.user.id)
      .maybeSingle();
    if (!session) {
      return res.status(403).json({ error: 'snap_session_id not found or not yours' });
    }
  }

  const { error } = await supabaseAdmin
    .from('snap_corrections')
    .insert({
      snap_session_id:  snap_session_id  || null,
      user_id:          req.user.id,
      rejected_food_id: rejected_food_id ? String(rejected_food_id) : null,
      correct_food_id:  String(correct_food_id),
      correct_name,
      hall,
      meal:             meal || null,
      is_passive:       false,
    });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
