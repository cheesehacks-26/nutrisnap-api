const { VertexAI } = require('@google-cloud/vertexai');

const vertexAI = new VertexAI({
  project: process.env.GCP_PROJECT_ID || 'nutrisnap-488901',
  location: process.env.GCP_LOCATION || 'us-central1',
});

const model = vertexAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
  generationConfig: { maxOutputTokens: 256 },
});

/**
 * Identify food items in a photo by matching against the current dining hall menu.
 *
 * @param {string} base64Image  - base64-encoded image (jpeg/png)
 * @param {Array}  menuItems    - CanteenFoodItem[] from fetchMenu
 * @param {string} hall         - dining hall name
 * @param {string} meal         - meal type
 * @returns {{ matchedIds: number[], unmatchedDescription: string|null }}
 */
async function identifyFood(base64Image, menuItems, hall, meal) {
  // Build menu context for Gemini
  const menuList = menuItems
    .map((item) => `${item.food_id} | ${item.name} | ${item.station || 'General'}`)
    .join('\n');

  const prompt = `You are a dining hall food identifier at the University of Wisconsin-Madison.
Given a photo taken at a dining hall, identify which items from the menu below are visible in the photo.

MENU (${hall}, ${meal}):
food_id | name | station
${menuList}

Instructions:
1. Look at the photo carefully and identify all visible food items.
2. Match them to items on the menu above by food_id.
3. If you see food that does NOT match any menu item (e.g. a custom salad, build-your-own), describe it briefly.

Respond with ONLY valid JSON in this exact format:
{"matched_ids": [1303352, 1334593], "unmatched_description": "a custom green salad with ranch dressing"}

If all items match the menu, set unmatched_description to null.
If you cannot identify any food, return {"matched_ids": [], "unmatched_description": null}.
Do not include any text outside the JSON.`;

  // Strip data URL prefix if present
  const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64,
            },
          },
        ],
      },
    ],
  });

  const text = result.response.candidates[0].content.parts[0].text.trim();

  // Parse JSON from response (handle markdown code blocks)
  const jsonStr = text.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
  const parsed = JSON.parse(jsonStr);

  return {
    matchedIds: parsed.matched_ids || [],
    unmatchedDescription: parsed.unmatched_description || null,
  };
}

module.exports = { identifyFood };
