const fs = require('fs');
const path = require('path');

// ── Backends ──────────────────────────────────────────────────────────────────
// Two ways to reach Gemini, picked automatically:
//   1. GEMINI_API_KEY   → Gemini API (AI Studio). FREE tier, no card, no GCP billing.
//   2. Service account  → Vertex AI. Needs GOOGLE_APPLICATION_CREDENTIALS + billing.
// The API key wins when both are present because it has no billing dependency.

const API_ROOT = path.resolve(__dirname, '..', '..');

function resolveCredentialsPath() {
  const configured = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const candidates = [];
  if (configured) candidates.push(path.isAbsolute(configured) ? configured : path.resolve(API_ROOT, configured));
  candidates.push(path.resolve(API_ROOT, 'gcp-key.json')); // local-dev fallback
  return candidates.find((c) => fs.existsSync(c)) || null;
}

const CREDENTIALS_PATH = resolveCredentialsPath();
const HAS_API_KEY = !!process.env.GEMINI_API_KEY;

if (CREDENTIALS_PATH && process.env.GOOGLE_APPLICATION_CREDENTIALS !== CREDENTIALS_PATH) {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.warn(`[vision] GOOGLE_APPLICATION_CREDENTIALS="${process.env.GOOGLE_APPLICATION_CREDENTIALS}" not found; using ${CREDENTIALS_PATH}`);
  }
  process.env.GOOGLE_APPLICATION_CREDENTIALS = CREDENTIALS_PATH;
}

if (HAS_API_KEY) {
  console.log('[vision] backend: Gemini API (GEMINI_API_KEY) — free tier');
} else if (CREDENTIALS_PATH) {
  console.warn('[vision] backend: Vertex AI (service account) — this path is BILLED. Set GEMINI_API_KEY to use the free tier instead.');
} else {
  console.warn('[vision] Not configured — set GEMINI_API_KEY (free) or GOOGLE_APPLICATION_CREDENTIALS. POST /api/snap will return 503.');
}

function isVisionConfigured() {
  return HAS_API_KEY || !!CREDENTIALS_PATH;
}

// ── Model selection (free-tier first) ─────────────────────────────────────────
// Verified 2026-09-03 against a free AI Studio key: 3.5-flash, 3.6-flash and
// 3.5-flash-lite all respond; the 2.5 family is "no longer available to new users".
// Order = quality first, then flash-lite (highest daily quota) as overflow. A 429
// puts that model on a short cooldown and the request hops to the next one, so a
// busy dinner rush degrades to flash-lite rather than failing. Models that 404 are
// dropped from rotation for the process lifetime.
// Override with GEMINI_MODELS=a,b,c (or legacy GEMINI_MODEL=a). To maximise free
// quota at some accuracy cost, put gemini-3.5-flash-lite first.
const DEFAULT_MODELS = 'gemini-3.5-flash,gemini-3.6-flash,gemini-3.5-flash-lite';
const MODEL_CANDIDATES = (process.env.GEMINI_MODELS || process.env.GEMINI_MODEL || DEFAULT_MODELS)
  .split(',').map((s) => s.trim()).filter(Boolean);

const MIN_CONFIDENCE = 0.3;                 // drop matches the model itself isn't confident about
const MAX_ATTEMPTS_PER_MODEL = 2;           // transient/parse errors only — never for quota
const QUOTA_COOLDOWN_MS = 5 * 60 * 1000;    // after a 429, skip that model for 5 min

// Structured output: guarantees parseable JSON, no markdown fences.
const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    matches: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          food_id:    { type: 'INTEGER' },
          confidence: { type: 'NUMBER' },
        },
        required: ['food_id', 'confidence'],
      },
    },
    unmatched_description: { type: 'STRING', nullable: true },
  },
  required: ['matches'],
};

const GENERATION_CONFIG = {
  temperature: 0.1,           // deterministic matching, not creative writing
  maxOutputTokens: 512,       // output is a short JSON list; keep the cap tight (output tokens cost most)
  responseMimeType: 'application/json',
  responseSchema: RESPONSE_SCHEMA,
};

let backend = null;

function getBackend() {
  if (backend) return backend;
  const cache = new Map();

  if (HAS_API_KEY) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    backend = {
      kind: 'gemini-api',
      async generate(modelName, request) {
        if (!cache.has(modelName)) cache.set(modelName, client.getGenerativeModel({ model: modelName, generationConfig: GENERATION_CONFIG }));
        const result = await cache.get(modelName).generateContent(request);
        return extractText(result);
      },
    };
  } else {
    const { VertexAI } = require('@google-cloud/vertexai');
    const client = new VertexAI({
      project: process.env.GCP_PROJECT_ID || 'nutrisnap-488901',
      location: process.env.GCP_LOCATION || 'us-central1',
    });
    backend = {
      kind: 'vertex',
      async generate(modelName, request) {
        if (!cache.has(modelName)) cache.set(modelName, client.getGenerativeModel({ model: modelName, generationConfig: GENERATION_CONFIG }));
        const result = await cache.get(modelName).generateContent(request);
        return extractText(result);
      },
    };
  }
  return backend;
}

// Per-model health: permanently-gone models and temporary quota cooldowns.
const unavailableModels = new Set();
const cooldownUntil = new Map();   // modelName -> epoch ms

// ── Error classification ──────────────────────────────────────────────────────
const msgOf = (err) => String(err?.message || err).toLowerCase();
const isQuota            = (err) => /429|resource_exhausted|quota|rate limit/.test(msgOf(err));
const isModelUnavailable = (err) => /not found|404|is not supported|no longer available|deprecated|unsupported model|invalid model/.test(msgOf(err));
const isTransient        = (err) => /503|unavailable|deadline|timeout|overloaded|500|internal/.test(msgOf(err));
const isAccessProblem    = (err) => /403|billing|permission_denied|api key not valid|api_key_invalid|unauthenticated|401/.test(msgOf(err));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Prompt ────────────────────────────────────────────────────────────────────
// Kept compact: every menu line is input tokens on every snap. id | name | station
// is enough for the model to disambiguate; category was dropped (rarely helped).
function buildPrompt(menuItems, hall, meal) {
  const menuList = menuItems
    .map((item) => `${item.food_id} | ${item.name}${item.station ? ` | ${item.station}` : ''}`)
    .join('\n');

  return `You identify food on dining-hall trays at the University of Wisconsin–Madison.
Given a photo, decide which items from TODAY'S MENU below are actually visible in it.

MENU (${hall}, ${meal}):
food_id | name | station
${menuList}

Rules:
1. Only include an item if you can clearly see it on the tray. Do not guess from what is "usually" served.
2. Match by appearance: colour, texture, shape, and how it is plated. When two menu items look similar
   (e.g. "Grilled Chicken Breast" vs "Chicken Tenders"), pick the single best match, not both.
3. Ignore drinks, packaging, cutlery, and condiment packets unless they are on the menu.
4. For each match give a confidence from 0 to 1 (1 = certain). Be honest — partially hidden or
   ambiguous items should be 0.4–0.6.
5. If you see food that is NOT on the menu (a custom salad, a build-your-own bowl), describe it
   briefly in unmatched_description; otherwise set it to null.
6. If the photo contains no food, return an empty matches array.

Respond with JSON only, matching this shape:
{"matches":[{"food_id":1303352,"confidence":0.92}],"unmatched_description":null}`;
}

// ── Response parsing ──────────────────────────────────────────────────────────
function extractText(result) {
  const response = result?.response;
  if (response && typeof response.text === 'function') {
    try { const t = response.text(); if (t) return t.trim(); } catch { /* fall through to manual extraction */ }
  }
  return response?.candidates?.[0]?.content?.parts
    ?.find((p) => typeof p.text === 'string')?.text?.trim() || '';
}

function parseResponse(text) {
  const jsonStr = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  const parsed = JSON.parse(jsonStr);
  // Accept both the new shape and the legacy {matched_ids:[...]} shape.
  const rawMatches = Array.isArray(parsed.matches)
    ? parsed.matches
    : (parsed.matched_ids || []).map((id) => ({ food_id: id, confidence: 0.75 }));
  return { rawMatches, unmatchedDescription: parsed.unmatched_description || null };
}

/**
 * Normalise model output: numeric ids only, must be on the menu, confidence
 * clamped to [0,1], de-duplicated (keep the highest confidence), sorted desc,
 * and filtered by MIN_CONFIDENCE.
 */
function normaliseMatches(rawMatches, menuIdSet) {
  const best = new Map();
  for (const m of rawMatches) {
    const id = Number.parseInt(m?.food_id, 10);
    if (!Number.isInteger(id) || !menuIdSet.has(id)) continue;
    let conf = Number(m?.confidence);
    if (!Number.isFinite(conf)) conf = 0.75;
    conf = Math.min(1, Math.max(0, conf));
    if (conf < MIN_CONFIDENCE) continue;
    if (!best.has(id) || best.get(id) < conf) best.set(id, conf);
  }
  return [...best.entries()]
    .map(([food_id, confidence]) => ({ food_id, confidence: Math.round(confidence * 100) / 100 }))
    .sort((a, b) => b.confidence - a.confidence);
}

// ── Public API ────────────────────────────────────────────────────────────────
/**
 * Identify food items in a photo by matching against the current dining hall menu.
 *
 * @param {string} base64Image  - base64 image, optionally a data: URL
 * @param {Array}  menuItems    - CanteenFoodItem[] from fetchMenu
 * @param {string} hall
 * @param {string} meal
 * @param {string} mimeType
 * @returns {{ matchedIds: number[], matches: {food_id:number, confidence:number}[], unmatchedDescription: string|null, model: string }}
 */
async function identifyFood(base64Image, menuItems, hall, meal, mimeType = 'image/jpeg') {
  if (!isVisionConfigured()) throw new Error('Vision service not configured');

  // Only real (numeric-id) menu items can be photo-matched; synthetic BYO shells can't.
  const candidates = menuItems.filter((i) => Number.isInteger(i.food_id));
  const menuIdSet = new Set(candidates.map((i) => i.food_id));
  const prompt = buildPrompt(candidates, hall, meal);

  const dataUrlMatch = base64Image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  const cleanBase64 = dataUrlMatch ? dataUrlMatch[2] : base64Image;
  const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
  const declaredMime = dataUrlMatch?.[1] || mimeType || 'image/jpeg';
  const safeMimeType = allowedMimeTypes.has(declaredMime) ? declaredMime : 'image/jpeg';

  const request = {
    contents: [{
      role: 'user',
      parts: [
        { text: prompt },
        { inlineData: { mimeType: safeMimeType, data: cleanBase64 } },
      ],
    }],
  };

  const be = getBackend();
  const now = Date.now();
  let lastErr = null;
  let tried = 0;

  for (const modelName of MODEL_CANDIDATES) {
    if (unavailableModels.has(modelName)) continue;
    if ((cooldownUntil.get(modelName) || 0) > now) continue;   // on quota cooldown — hop
    tried++;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt++) {
      try {
        const text = await be.generate(modelName, request);
        if (!text) throw new Error('Vision model returned empty response');
        const { rawMatches, unmatchedDescription } = parseResponse(text);
        const matches = normaliseMatches(rawMatches, menuIdSet);
        return { matchedIds: matches.map((m) => m.food_id), matches, unmatchedDescription, model: modelName };
      } catch (err) {
        lastErr = err;
        if (isAccessProblem(err)) {
          // Billing / key / permission problems won't fix themselves by retrying or switching models.
          const e = new Error(`Vision backend (${be.kind}) rejected the request: ${String(err.message).split('\n')[0].slice(0, 200)}`);
          e.status = 503;
          throw e;
        }
        if (isQuota(err)) {
          // Don't retry the same model (that just burns more quota); cool it down and hop.
          cooldownUntil.set(modelName, Date.now() + QUOTA_COOLDOWN_MS);
          console.warn(`[vision] ${modelName} quota hit — cooling down ${QUOTA_COOLDOWN_MS / 60000} min, trying next model`);
          break;
        }
        if (isModelUnavailable(err)) {
          unavailableModels.add(modelName);
          console.warn(`[vision] model ${modelName} unavailable, removed from rotation: ${err.message}`);
          break;
        }
        const parseFailure = err instanceof SyntaxError || /empty response/.test(err.message || '');
        if ((isTransient(err) || parseFailure) && attempt < MAX_ATTEMPTS_PER_MODEL) {
          await sleep(isTransient(err) ? 800 : 200);
          continue;
        }
        throw err;
      }
    }
  }

  const e = new Error(
    tried === 0
      ? 'All vision models are on quota cooldown — try again in a few minutes'
      : `No available Gemini model (tried: ${MODEL_CANDIDATES.join(', ')}). Last error: ${lastErr?.message}`
  );
  e.status = tried === 0 || (lastErr && isQuota(lastErr)) ? 429 : 503;
  throw e;
}

module.exports = { identifyFood, isVisionConfigured, MODEL_CANDIDATES };
