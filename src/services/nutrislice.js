const { DINING_HALLS, getTodayCT } = require('../config/diningHalls');
const { getBYOComponents } = require('../data/byoComponents');

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
    items.push(parseFoodItem(food, item, stationNames, date, mealType));
  }

  return items;
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

function parseFoodItem(food, menuItem, stationNames, date, mealType) {
  const n = food.rounded_nutrition_info ?? {};
  const sizeInfo = food.serving_size_info ?? {};

  const servingAmount = sizeInfo.serving_size_amount ?? menuItem.serving_size_amount ?? '';
  const servingUnit = sizeInfo.serving_size_unit ?? menuItem.serving_size_unit ?? '';
  const servingSize = [servingAmount, servingUnit].filter(Boolean).join(' ') || null;

  const stationName = menuItem.station_id != null
    ? (stationNames[menuItem.station_id] ?? null)
    : null;

  const isBYO = food.has_options_or_sides === true;
  const byoData = isBYO ? getBYOComponents(food.id) : null;

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
