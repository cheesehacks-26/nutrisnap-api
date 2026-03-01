const { DINING_HALLS, getTodayCT } = require('../config/diningHalls');
const { getBYOComponents, isBYOSubName } = require('../data/byoComponents');

const NUTRISLICE_BASE = 'https://wisc-housingdining.api.nutrislice.com/menu/api/weeks/school';
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];

// In-memory cache: key = "hall:meal:date" -> { items, fetchedAt }
const cache = new Map();

/**
 * Get menu from cache. Falls back to Nutrislice API on cache miss.
 */
async function fetchMenu(hall, mealType, date) {
  const key = `${hall}:${mealType}:${date}`;
  if (cache.has(key)) return cache.get(key).items;

  const items = await fetchFromAPI(hall, mealType, date);
  cache.set(key, { items, fetchedAt: Date.now() });
  return items;
}

/**
 * Warm the cache for all halls × all meal types for today.
 * Called once on server start. Logs progress.
 */
async function warmCache() {
  const today = getTodayCT();
  const halls = Object.keys(DINING_HALLS);
  console.log(`Warming cache for ${halls.length} halls × ${MEAL_TYPES.length} meals (${today})...`);

  const results = await Promise.allSettled(
    halls.flatMap((hall) =>
      MEAL_TYPES.map(async (meal) => {
        const items = await fetchFromAPI(hall, meal, today);
        cache.set(`${hall}:${meal}:${today}`, { items, fetchedAt: Date.now() });
        return { hall, meal, count: items.length };
      })
    )
  );

  let total = 0;
  for (const r of results) {
    if (r.status === 'fulfilled') total += r.value.count;
  }
  const failed = results.filter((r) => r.status === 'rejected').length;
  console.log(`Cache warm: ${total} items cached.${failed ? ` (${failed} requests failed)` : ''}`);
}

/**
 * Fetch directly from Nutrislice API (no cache).
 */
async function fetchFromAPI(hall, mealType, date) {
  const [year, month, day] = date.split('-');
  const url = `${NUTRISLICE_BASE}/${DINING_HALLS[hall]}/menu-type/${mealType}/${year}/${month}/${day}/?format=json`;

  const res = await fetch(url);
  if (!res.ok) {
    const err = new Error(`Nutrislice API error: ${res.status} ${res.statusText}`);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  return parseMenuResponse(data, date, mealType);
}

const SANDWICH_STATION_HEADERS = /^(breads|choose your protein|choose your cheese|vegetables|condiment|toppings|breads\s*-\s*gluten free)/i;
const BREAKFAST_ONLY_BYO = /breakfast sandwich/i;

/**
 * Parse the raw Nutrislice API response into CanteenFoodItem[].
 */
function parseMenuResponse(data, date, mealType) {
  const days = data?.days ?? [];
  const targetDay = days.find((d) => d.date === date);
  if (!targetDay) return [];

  const menuItems = targetDay.menu_items ?? [];
  const stationNames = buildStationMap(menuItems);

  const seen = new Set();
  const items = [];

  for (const item of menuItems) {
    const food = item?.food;
    if (!food || typeof food !== 'object' || !food.id) continue;
    if (seen.has(food.id)) continue;
    seen.add(food.id);

    if (mealType !== 'breakfast' && BREAKFAST_ONLY_BYO.test(food.name)) continue;

    items.push(parseFoodItem(food, item, stationNames, date, mealType));
  }

  const hasBYOSandwich = items.some(i => i.is_build_your_own && /sandwich/i.test(i.name) && !BREAKFAST_ONLY_BYO.test(i.name));
  const stationHeaderNames = menuItems.filter(i => i.is_station_header && i.text).map(i => i.text);
  const hasSandwichStations = stationHeaderNames.filter(h => SANDWICH_STATION_HEADERS.test(h)).length >= 3;

  if (!hasBYOSandwich && hasSandwichStations) {
    const sandwichData = getBYOComponents(null, 'Build Your Own Sandwich');
    items.push({
      food_id: `synthetic-sandwich-${date}-${mealType}`,
      name: 'Build Your Own Sandwich',
      food_category: 'other',
      station: 'Build Your Own',
      serving_size: null,
      nutrition: { calories: 0, g_fat: 0, g_saturated_fat: 0, g_trans_fat: 0, g_carbs: 0, g_sugar: 0, g_fiber: 0, g_protein: 0, mg_sodium: 0, mg_cholesterol: 0, mg_calcium: 0, mg_potassium: 0 },
      food_tags: [],
      is_build_your_own: true,
      is_byo_component: false,
      byo_components: sandwichData ? sandwichData.categories : null,
      date,
      meal_type: mealType,
    });
  }

  autoFillUnknownBYO(items, menuItems, stationNames);

  return items;
}

/**
 * For BYO items with no static component data, auto-build categories
 * from BYO-station items already present in the raw menu data.
 * Skips BYO parent items and the "Build Your Own" station itself.
 */
function autoFillUnknownBYO(items, rawMenuItems, stationNames) {
  const unknownBYO = items.filter(i => i.is_build_your_own && !i.byo_components);
  if (unknownBYO.length === 0) return;

  const byoParentIds = new Set(
    rawMenuItems.filter(mi => mi.food && mi.food.has_options_or_sides).map(mi => mi.food.id)
  );

  const COMPONENT_STATION = /^(choose your|varies by day|breads|breads\s*-\s*gluten free|vegetables|condiment|toppings|station recipe)/i;

  const byoStationCategories = {};
  for (const mi of rawMenuItems) {
    if (!mi.food || mi.is_station_header) continue;
    if (byoParentIds.has(mi.food.id)) continue;
    const stName = mi.station_id != null ? (stationNames[mi.station_id] ?? null) : null;
    if (!stName || !COMPONENT_STATION.test(stName)) continue;

    if (!byoStationCategories[stName]) byoStationCategories[stName] = [];
    const existing = byoStationCategories[stName];
    if (existing.some(e => e.name === mi.food.name)) continue;

    const n = mi.food.rounded_nutrition_info ?? {};
    const sizeInfo = mi.food.serving_size_info ?? {};
    const servAmt = sizeInfo.serving_size_amount ?? mi.serving_size_amount ?? '';
    const servUnit = sizeInfo.serving_size_unit ?? mi.serving_size_unit ?? '';
    const serving = [servAmt, servUnit].filter(Boolean).join(' ') || null;

    existing.push({
      name: mi.food.name ?? 'Unknown',
      serving_size: serving,
      nutrition: {
        calories: toNum(n.calories),
        g_protein: toNum(n.g_protein),
        g_carbs: toNum(n.g_carbs),
        g_fat: toNum(n.g_fat),
        g_sugar: toNum(n.g_sugar),
        mg_sodium: toNum(n.mg_sodium),
      },
    });
  }

  const stationLabels = Object.keys(byoStationCategories);
  if (stationLabels.length === 0) return;

  const autoCategories = stationLabels.map(label => ({
    label: label.replace(/^\w/, c => c.toUpperCase()),
    items: byoStationCategories[label],
  }));

  for (const byo of unknownBYO) {
    byo.byo_components = autoCategories;
    console.log(`[auto-fill] Unknown BYO "${byo.name}" → ${autoCategories.length} categories, ${autoCategories.reduce((n, c) => n + c.items.length, 0)} items`);
  }
}

function buildStationMap(menuItems) {
  const map = {};
  for (const item of menuItems) {
    if (item.is_station_header && item.station_id != null && item.text) {
      map[item.station_id] = item.text;
    }
  }
  return map;
}

const BYO_STATION_PATTERN = /^(choose your|build your own|varies by day|breads|breads\s*-\s*gluten free|vegetables|condiment|toppings|station recipe)/i;

function parseFoodItem(food, menuItem, stationNames, date, mealType) {
  const n = food.rounded_nutrition_info ?? {};
  const sizeInfo = food.serving_size_info ?? {};

  const servingAmount = sizeInfo.serving_size_amount ?? menuItem.serving_size_amount ?? '';
  const servingUnit = sizeInfo.serving_size_unit ?? menuItem.serving_size_unit ?? '';
  const servingSize = [servingAmount, servingUnit].filter(Boolean).join(' ') || null;

  const stationName = menuItem.station_id != null
    ? (stationNames[menuItem.station_id] ?? null)
    : null;

  const CONDIMENT_PATTERN = /condiment/i;
  const rawBYO = food.has_options_or_sides === true;
  const isBYO = rawBYO && !CONDIMENT_PATTERN.test(food.name);
  const byoData = isBYO ? getBYOComponents(food.id, food.name) : null;
  const isBYOComponent = !isBYO && (
    (stationName && BYO_STATION_PATTERN.test(stationName)) ||
    (!stationName && isBYOSubName(food.name)) ||
    isBYOSubName(food.name, true)
  );

  return {
    food_id: food.id,
    name: food.name ?? 'Unknown',
    food_category: food.food_category ?? 'other',
    station: stationName,
    serving_size: servingSize,
    nutrition: {
      calories: toNum(n.calories),
      g_fat: toNum(n.g_fat),
      g_saturated_fat: toNum(n.g_saturated_fat),
      g_trans_fat: toNum(n.g_trans_fat),
      g_carbs: toNum(n.g_carbs),
      g_sugar: toNum(n.g_sugar),
      g_fiber: toNum(n.g_fiber),
      g_protein: toNum(n.g_protein),
      mg_sodium: toNum(n.mg_sodium),
      mg_cholesterol: toNum(n.mg_cholesterol),
      mg_calcium: toNum(n.mg_calcium),
      mg_potassium: toNum(n.mg_potassium),
    },
    food_tags: parseFoodTags(food.icons),
    is_build_your_own: isBYO,
    is_byo_component: isBYOComponent,
    byo_components: byoData ? byoData.categories : null,
    date,
    meal_type: mealType,
  };
}

function parseFoodTags(icons) {
  if (!icons) return [];
  const foodIcons = icons.food_icons ?? [];
  return foodIcons.map((icon) => icon?.name ?? icon?.synced_name).filter(Boolean);
}

function toNum(val) {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

module.exports = { fetchMenu, warmCache };
