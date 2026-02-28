const { DINING_HALLS } = require('../config/diningHalls');

const NUTRISLICE_BASE = 'https://wisc-housingdining.api.nutrislice.com/menu/api/weeks/school';

/**
 * Fetch the menu from Nutrislice for a given dining hall, meal type, and date.
 *
 * @param {string} hall     - dining hall id, e.g. "gordon-avenue-market"
 * @param {string} mealType - "breakfast" | "lunch" | "dinner"
 * @param {string} date     - "YYYY-MM-DD"
 * @returns {Promise<object[]>}
 */
async function fetchMenu(hall, mealType, date) {
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
 * The API returns a weeks payload with a `days` array — we find the matching day.
 */
function parseMenuResponse(data, date, mealType) {
  const days = data?.days ?? [];
  const targetDay = days.find((d) => d.date === date);
  if (!targetDay) return [];

  const menuItems = targetDay.menu_items ?? [];

  // Build station_id -> name map from station header items
  const stationNames = buildStationMap(menuItems);

  const seen = new Set();
  const items = [];

  for (const item of menuItems) {
    const food = item?.food;
    // Skip section titles, station headers, and items without food
    if (!food || typeof food !== 'object' || !food.id) continue;

    // Deduplicate by food_id within a single response
    if (seen.has(food.id)) continue;
    seen.add(food.id);

    items.push(parseFoodItem(food, item, stationNames, date, mealType));
  }

  return items;
}

/**
 * Walk menu_items and collect station_id -> station_name from header entries.
 * Station headers have is_station_header=true and carry the human-readable name in `text`.
 */
function buildStationMap(menuItems) {
  const map = {};
  for (const item of menuItems) {
    if (item.is_station_header && item.station_id != null && item.text) {
      map[item.station_id] = item.text;
    }
  }
  return map;
}

/**
 * Map a single Nutrislice food + menu_item object to a CanteenFoodItem.
 */
function parseFoodItem(food, menuItem, stationNames, date, mealType) {
  const n = food.rounded_nutrition_info ?? {};
  const sizeInfo = food.serving_size_info ?? {};

  const servingAmount = sizeInfo.serving_size_amount ?? menuItem.serving_size_amount ?? '';
  const servingUnit = sizeInfo.serving_size_unit ?? menuItem.serving_size_unit ?? '';
  const servingSize = [servingAmount, servingUnit].filter(Boolean).join(' ') || null;

  const stationName = menuItem.station_id != null
    ? (stationNames[menuItem.station_id] ?? null)
    : null;

  return {
    food_id: food.id,
    name: food.name ?? 'Unknown',
    food_category: food.food_category ?? 'other',
    station: stationName,
    serving_size: servingSize,
    nutrition: {
      // rounded_nutrition_info already uses g_/mg_ prefixed keys
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
    is_build_your_own: food.has_options_or_sides === true,
    date,
    meal_type: mealType,
  };
}

/**
 * Nutrislice icons field is: { food_icons: [{ name, slug, ... }], myplate_icons: [] }
 */
function parseFoodTags(icons) {
  if (!icons) return [];
  const foodIcons = icons.food_icons ?? [];
  return foodIcons.map((icon) => icon?.name ?? icon?.synced_name).filter(Boolean);
}

function toNum(val) {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

module.exports = { fetchMenu };
