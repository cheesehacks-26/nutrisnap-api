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
 * @param {string} mimeType     - declared MIME type for base64 image
 * @returns {{ matchedIds: number[], unmatchedDescription: string|null }}
 */
async function identifyFood(base64Image, menuItems, hall, meal, mimeType = 'image/jpeg') {
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

  const dataUrlMatch = base64Image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  const cleanBase64 = dataUrlMatch ? dataUrlMatch[2] : base64Image;
  const imageMimeType = dataUrlMatch?.[1] || mimeType || 'image/jpeg';
  const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
  const safeMimeType = allowedMimeTypes.has(imageMimeType) ? imageMimeType : 'image/jpeg';

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: safeMimeType,
              data: cleanBase64,
            },
          },
        ],
      },
    ],
  });

  const text = result?.response?.candidates?.[0]?.content?.parts?.find((part) => typeof part.text === 'string')?.text?.trim();
  if (!text) {
    throw new Error('Vision model returned empty response');
  }

  // Parse JSON from response (handle markdown code blocks)
  const jsonStr = text.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
  const parsed = JSON.parse(jsonStr);

  return {
    matchedIds: parsed.matched_ids || [],
    unmatchedDescription: parsed.unmatched_description || null,
  };
}

module.exports = { identifyFood };
