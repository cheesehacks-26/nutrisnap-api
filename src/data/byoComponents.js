/**
 * Static lookup for Build-Your-Own item components.
 * Keyed by Nutrislice parent food_id.
 * Nutrition values sourced from USDA FoodData Central.
 */

const BYO_COMPONENTS = {
  // ─── Build Your Own Yogurt Bar ───────────────────────────────────
  3371: {
    name: 'Build Your Own Yogurt Bar',
    categories: [
      {
        label: 'Choose Your Base',
        items: [
          { nested_id: 1847783, name: 'Non Fat Plain Greek Yogurt', serving_size: '0.25 cups', nutrition: { calories: 35, g_protein: 6, g_carbs: 3, g_fat: 0, g_sugar: 2, mg_sodium: 25 } },
          { nested_id: 1340429, name: 'Vanilla Greek Yogurt',      serving_size: '0.25 cups', nutrition: { calories: 50, g_protein: 5, g_carbs: 6, g_fat: 0.5, g_sugar: 5, mg_sodium: 20 } },
          { nested_id: 1340430, name: 'Vanilla Coconut Milk Yogurt', serving_size: '0.25 cups', nutrition: { calories: 45, g_protein: 0, g_carbs: 7, g_fat: 2, g_sugar: 5, mg_sodium: 10 } },
          { name: 'Strawberry Greek Yogurt',                         serving_size: '0.25 cups', nutrition: { calories: 55, g_protein: 5, g_carbs: 8, g_fat: 0, g_sugar: 7, mg_sodium: 20 } },
        ],
      },
      {
        label: 'Choose Your Toppings',
        items: [
          { nested_id: 1340433, name: 'Strawberries',              serving_size: '0.5 cups',  nutrition: { calories: 25, g_protein: 0.5, g_carbs: 6, g_fat: 0, g_sugar: 4, mg_sodium: 1 } },
          { nested_id: 1427124, name: 'Blueberries',               serving_size: '0.5 cups',  nutrition: { calories: 42, g_protein: 0.5, g_carbs: 11, g_fat: 0, g_sugar: 7, mg_sodium: 1 } },
          { nested_id: 1340436, name: 'Craisins',                  serving_size: '1 Tbsp',    nutrition: { calories: 26, g_protein: 0, g_carbs: 7, g_fat: 0, g_sugar: 6, mg_sodium: 0 } },
          { nested_id: 1340437, name: 'Sweetened Coconut Flakes',   serving_size: '1 Tbsp',    nutrition: { calories: 33, g_protein: 0, g_carbs: 3, g_fat: 2.5, g_sugar: 3, mg_sodium: 3 } },
          { nested_id: 1340438, name: 'Chocolate Chips',            serving_size: '1 Tbsp',    nutrition: { calories: 70, g_protein: 1, g_carbs: 9, g_fat: 4, g_sugar: 8, mg_sodium: 5 } },
          { nested_id: 1340440, name: 'Vanilla Granola',            serving_size: '0.25 cups', nutrition: { calories: 120, g_protein: 3, g_carbs: 18, g_fat: 5, g_sugar: 6, mg_sodium: 50 } },
        ],
      },
    ],
  },

  // ─── Build Your Own Salad ────────────────────────────────────────
  4783: {
    name: 'Build Your Own Salad',
    categories: [
      {
        label: 'Choose Your Base',
        items: [
          { nested_id: 1311136, name: 'Spring Mix Greens',          serving_size: '0.25 cup',  nutrition: { calories: 5, g_protein: 0.5, g_carbs: 1, g_fat: 0, g_sugar: 0, mg_sodium: 10 } },
          { nested_id: 1311137, name: 'Lettuce & Romaine Mix',      serving_size: '1 cup',     nutrition: { calories: 10, g_protein: 1, g_carbs: 2, g_fat: 0, g_sugar: 1, mg_sodium: 5 } },
          { nested_id: 1311138, name: 'Spinach',                    serving_size: '0.5 cup',   nutrition: { calories: 4, g_protein: 1, g_carbs: 1, g_fat: 0, g_sugar: 0, mg_sodium: 12 } },
        ],
      },
      {
        label: 'Choose Your Topping',
        items: [
          { nested_id: 1311139, name: 'Cottage Cheese',             serving_size: '0.25 cup',  nutrition: { calories: 55, g_protein: 6, g_carbs: 3, g_fat: 2, g_sugar: 2, mg_sodium: 230 } },
          { nested_id: 1311140, name: 'Cheddar Cheese',             serving_size: '1 oz',      nutrition: { calories: 113, g_protein: 7, g_carbs: 0, g_fat: 9, g_sugar: 0, mg_sodium: 174 } },
          { nested_id: 1311141, name: 'Hard Cooked Egg',            serving_size: '1 each',    nutrition: { calories: 78, g_protein: 6, g_carbs: 1, g_fat: 5, g_sugar: 0, mg_sodium: 62 } },
          { nested_id: 1311109, name: 'Hummus',                     serving_size: '0.125 cup', nutrition: { calories: 52, g_protein: 2, g_carbs: 5, g_fat: 3, g_sugar: 0, mg_sodium: 114 } },
          { nested_id: 1311142, name: 'Broccoli Florets',           serving_size: '0.25 cup',  nutrition: { calories: 8, g_protein: 1, g_carbs: 2, g_fat: 0, g_sugar: 0, mg_sodium: 8 } },
          { nested_id: 1311144, name: 'Carrots',                    serving_size: '0.125 cups', nutrition: { calories: 6, g_protein: 0, g_carbs: 2, g_fat: 0, g_sugar: 1, mg_sodium: 10 } },
          { nested_id: 1311145, name: 'Cucumber',                   serving_size: '0.25 cup',  nutrition: { calories: 4, g_protein: 0, g_carbs: 1, g_fat: 0, g_sugar: 0, mg_sodium: 1 } },
          { nested_id: 1311143, name: 'Mushrooms',                  serving_size: '0.25 cups', nutrition: { calories: 5, g_protein: 1, g_carbs: 1, g_fat: 0, g_sugar: 0, mg_sodium: 1 } },
          { nested_id: 1309900, name: 'Sliced Red Onion',           serving_size: '0.25 cup',  nutrition: { calories: 12, g_protein: 0, g_carbs: 3, g_fat: 0, g_sugar: 1, mg_sodium: 1 } },
          { nested_id: 1311117, name: 'Green Pepper',               serving_size: '0.25 cups', nutrition: { calories: 5, g_protein: 0, g_carbs: 1, g_fat: 0, g_sugar: 1, mg_sodium: 1 } },
          { nested_id: 1309901, name: 'Grape Tomatoes',             serving_size: '1 each',    nutrition: { calories: 3, g_protein: 0, g_carbs: 1, g_fat: 0, g_sugar: 1, mg_sodium: 1 } },
          { nested_id: 1311090, name: 'Sunflower Seeds',            serving_size: '1 Tbsp',    nutrition: { calories: 51, g_protein: 2, g_carbs: 2, g_fat: 4.5, g_sugar: 0, mg_sodium: 1 } },
          { nested_id: 1311134, name: 'Homestyle Croutons',         serving_size: '1 Tbsp',    nutrition: { calories: 30, g_protein: 1, g_carbs: 4, g_fat: 1, g_sugar: 0, mg_sodium: 60 } },
          { nested_id: 1311135, name: 'Bacon Bits',                 serving_size: '1 Tbsp',    nutrition: { calories: 33, g_protein: 3, g_carbs: 0, g_fat: 2, g_sugar: 0, mg_sodium: 220 } },
        ],
      },
    ],
  },

  // ─── Build Your Own Sandwich ─────────────────────────────────────
  3658: {
    name: 'Build Your Own Sandwich',
    categories: [
      {
        label: 'Choose Your Bread',
        items: [
          { name: 'Tortilla - Whole Wheat (12")',     serving_size: '1 each',    nutrition: { calories: 210, g_protein: 6, g_carbs: 36, g_fat: 5, g_sugar: 1, mg_sodium: 430 } },
          { name: 'Flour Tortilla',                   serving_size: '1 each',    nutrition: { calories: 190, g_protein: 5, g_carbs: 32, g_fat: 5, g_sugar: 1, mg_sodium: 400 } },
          { name: 'Tortilla - Spinach Herb (12")',    serving_size: '1 each',    nutrition: { calories: 210, g_protein: 6, g_carbs: 35, g_fat: 5, g_sugar: 1, mg_sodium: 420 } },
          { name: 'Croissant',                        serving_size: '1 each',    nutrition: { calories: 231, g_protein: 5, g_carbs: 26, g_fat: 12, g_sugar: 4, mg_sodium: 312 } },
          { name: 'Pretzel Bun',                      serving_size: '1 each',    nutrition: { calories: 250, g_protein: 7, g_carbs: 48, g_fat: 3, g_sugar: 3, mg_sodium: 580 } },
          { name: 'French Roll',                      serving_size: '1 each',    nutrition: { calories: 180, g_protein: 6, g_carbs: 34, g_fat: 2, g_sugar: 2, mg_sodium: 320 } },
          { name: 'Wheat Sub Roll',                   serving_size: '1 each',    nutrition: { calories: 190, g_protein: 7, g_carbs: 36, g_fat: 2, g_sugar: 3, mg_sodium: 340 } },
          { name: 'Multigrain Bread',                 serving_size: '1 slice',   nutrition: { calories: 110, g_protein: 5, g_carbs: 20, g_fat: 2, g_sugar: 3, mg_sodium: 170 } },
          { name: 'Gluten Free White Bread',          serving_size: '1/2 slice', nutrition: { calories: 65, g_protein: 1, g_carbs: 13, g_fat: 1.5, g_sugar: 2, mg_sodium: 100 } },
          { name: 'Gluten Free Multigrain Bread',     serving_size: '1/2 slice', nutrition: { calories: 70, g_protein: 1, g_carbs: 14, g_fat: 1.5, g_sugar: 2, mg_sodium: 105 } },
          { name: 'Gluten Free Tortilla',             serving_size: '1 each',    nutrition: { calories: 150, g_protein: 1, g_carbs: 28, g_fat: 4, g_sugar: 1, mg_sodium: 310 } },
        ],
      },
      {
        label: 'Choose Your Protein',
        items: [
          { name: 'Oven Roasted Turkey',              serving_size: '1 slice',   nutrition: { calories: 22, g_protein: 4, g_carbs: 1, g_fat: 0, g_sugar: 0, mg_sodium: 178 } },
          { name: 'Roast Beef',                       serving_size: '1 slice',   nutrition: { calories: 30, g_protein: 5, g_carbs: 0, g_fat: 1, g_sugar: 0, mg_sodium: 140 } },
          { name: 'Smoked Ham',                       serving_size: '1 slice',   nutrition: { calories: 30, g_protein: 5, g_carbs: 1, g_fat: 1, g_sugar: 1, mg_sodium: 270 } },
          { name: 'Pork & Beef Hard Salami',          serving_size: '1 slice',   nutrition: { calories: 41, g_protein: 2, g_carbs: 0, g_fat: 3, g_sugar: 0, mg_sodium: 170 } },
        ],
      },
      {
        label: 'Choose Your Cheese',
        items: [
          { name: 'Pepper Jack Cheese',               serving_size: '1 slice',   nutrition: { calories: 80, g_protein: 5, g_carbs: 0, g_fat: 6, g_sugar: 0, mg_sodium: 150 } },
          { name: 'Provolone Cheese',                 serving_size: '1 slice',   nutrition: { calories: 75, g_protein: 5, g_carbs: 1, g_fat: 6, g_sugar: 0, mg_sodium: 190 } },
          { name: 'Cheddar Cheese',                   serving_size: '1 slice',   nutrition: { calories: 80, g_protein: 5, g_carbs: 0, g_fat: 7, g_sugar: 0, mg_sodium: 130 } },
          { name: 'Vegan Smoked Gouda',               serving_size: '1 slice',   nutrition: { calories: 60, g_protein: 0, g_carbs: 6, g_fat: 4, g_sugar: 0, mg_sodium: 200 } },
        ],
      },
      {
        label: 'Choose Your Toppings',
        items: [
          { name: 'Spinach',                          serving_size: '0.5 cup',   nutrition: { calories: 4, g_protein: 1, g_carbs: 1, g_fat: 0, g_sugar: 0, mg_sodium: 12 } },
          { name: 'Pickle Chips',                     serving_size: '0.25 cup',  nutrition: { calories: 4, g_protein: 0, g_carbs: 1, g_fat: 0, g_sugar: 0, mg_sodium: 280 } },
          { name: 'Banana Peppers',                   serving_size: '1 Tbsp',    nutrition: { calories: 2, g_protein: 0, g_carbs: 0, g_fat: 0, g_sugar: 0, mg_sodium: 70 } },
          { name: 'Sliced Red Onion',                 serving_size: '0.25 cup',  nutrition: { calories: 12, g_protein: 0, g_carbs: 3, g_fat: 0, g_sugar: 1, mg_sodium: 1 } },
          { name: 'Iceberg Lettuce',                  serving_size: '0.25 cup',  nutrition: { calories: 3, g_protein: 0, g_carbs: 1, g_fat: 0, g_sugar: 0, mg_sodium: 2 } },
          { name: 'Sliced Tomato',                    serving_size: '1 slice',   nutrition: { calories: 5, g_protein: 0, g_carbs: 1, g_fat: 0, g_sugar: 1, mg_sodium: 1 } },
          { name: 'Avocado',                          serving_size: '0.125 cup', nutrition: { calories: 40, g_protein: 0.5, g_carbs: 2, g_fat: 4, g_sugar: 0, mg_sodium: 2 } },
          { name: 'Bacon',                            serving_size: '1 slice',   nutrition: { calories: 43, g_protein: 3, g_carbs: 0, g_fat: 3, g_sugar: 0, mg_sodium: 137 } },
          { name: 'Giardiniera',                      serving_size: '1 scoop',   nutrition: { calories: 10, g_protein: 0, g_carbs: 2, g_fat: 0.5, g_sugar: 1, mg_sodium: 160 } },
        ],
      },
      {
        label: 'Choose Your Condiment',
        items: [
          { name: 'Chipotle Mayonnaise',              serving_size: '1 Tbsp',    nutrition: { calories: 90, g_protein: 0, g_carbs: 1, g_fat: 10, g_sugar: 0, mg_sodium: 110 } },
          { name: 'Dijon Mustard',                    serving_size: '1 Tbsp',    nutrition: { calories: 15, g_protein: 1, g_carbs: 1, g_fat: 1, g_sugar: 0, mg_sodium: 360 } },
          { name: 'Mayonnaise',                       serving_size: '1 Tbsp',    nutrition: { calories: 94, g_protein: 0, g_carbs: 0, g_fat: 10, g_sugar: 0, mg_sodium: 88 } },
          { name: 'Pesto Mayonnaise',                 serving_size: '1 Tbsp',    nutrition: { calories: 90, g_protein: 0, g_carbs: 1, g_fat: 10, g_sugar: 0, mg_sodium: 120 } },
          { name: 'Sweet & Spicy Boom Boom Sauce',    serving_size: '1 oz',      nutrition: { calories: 80, g_protein: 0, g_carbs: 8, g_fat: 5, g_sugar: 6, mg_sodium: 200 } },
          { name: 'Yellow Mustard',                   serving_size: '1 tsp',     nutrition: { calories: 3, g_protein: 0, g_carbs: 0, g_fat: 0, g_sugar: 0, mg_sodium: 55 } },
        ],
      },
      {
        label: 'Choose Your Side',
        items: [
          { name: 'Ruffle Potato Chips',              serving_size: '0.25 cup',  nutrition: { calories: 80, g_protein: 1, g_carbs: 8, g_fat: 5, g_sugar: 0, mg_sodium: 95 } },
        ],
      },
    ],
  },

  // ─── Build Your Own Breakfast Sandwich ───────────────────────────
  4817: {
    name: 'Build Your Own Breakfast Sandwich',
    categories: [
      {
        label: 'Choose Your Bread',
        items: [
          { name: 'Croissant',                        serving_size: '1 each',    nutrition: { calories: 231, g_protein: 5, g_carbs: 26, g_fat: 12, g_sugar: 4, mg_sodium: 312 } },
          { name: 'English Muffin',                   serving_size: '1 each',    nutrition: { calories: 132, g_protein: 5, g_carbs: 26, g_fat: 1, g_sugar: 2, mg_sodium: 264 } },
          { name: 'Flour Tortilla',                   serving_size: '1 each',    nutrition: { calories: 190, g_protein: 5, g_carbs: 32, g_fat: 5, g_sugar: 1, mg_sodium: 400 } },
          { name: 'Multigrain Bread',                 serving_size: '1 slice',   nutrition: { calories: 110, g_protein: 5, g_carbs: 20, g_fat: 2, g_sugar: 3, mg_sodium: 170 } },
        ],
      },
      {
        label: 'Choose Your Protein',
        items: [
          { name: 'Scrambled Eggs',                   serving_size: '1 each',    nutrition: { calories: 91, g_protein: 6, g_carbs: 1, g_fat: 7, g_sugar: 1, mg_sodium: 88 } },
          { name: 'Bacon',                            serving_size: '1 slice',   nutrition: { calories: 43, g_protein: 3, g_carbs: 0, g_fat: 3, g_sugar: 0, mg_sodium: 137 } },
          { name: 'Sausage Patty',                    serving_size: '1 each',    nutrition: { calories: 120, g_protein: 6, g_carbs: 1, g_fat: 10, g_sugar: 0, mg_sodium: 240 } },
        ],
      },
      {
        label: 'Choose Your Cheese',
        items: [
          { name: 'American Cheese',                  serving_size: '1 slice',   nutrition: { calories: 70, g_protein: 4, g_carbs: 2, g_fat: 5, g_sugar: 1, mg_sodium: 270 } },
          { name: 'Cheddar Cheese',                   serving_size: '1 slice',   nutrition: { calories: 80, g_protein: 5, g_carbs: 0, g_fat: 7, g_sugar: 0, mg_sodium: 130 } },
        ],
      },
    ],
  },

  // ─── Build Your Own Que Rico ─────────────────────────────────────
  3373: {
    name: 'Build Your Own Que Rico',
    categories: [
      {
        label: 'Choose Your Base',
        items: [
          { name: 'Cilantro Lime Rice',               serving_size: '0.5 cup',   nutrition: { calories: 130, g_protein: 2, g_carbs: 28, g_fat: 1, g_sugar: 0, mg_sodium: 190 } },
          { name: 'Flour Tortilla',                   serving_size: '1 each',    nutrition: { calories: 190, g_protein: 5, g_carbs: 32, g_fat: 5, g_sugar: 1, mg_sodium: 400 } },
          { name: 'Tortilla Chips',                   serving_size: '1 oz',      nutrition: { calories: 140, g_protein: 2, g_carbs: 18, g_fat: 7, g_sugar: 0, mg_sodium: 110 } },
        ],
      },
      {
        label: 'Choose Your Protein',
        items: [
          { name: 'Seasoned Chicken',                 serving_size: '3 oz',      nutrition: { calories: 130, g_protein: 20, g_carbs: 2, g_fat: 4, g_sugar: 0, mg_sodium: 350 } },
          { name: 'Seasoned Ground Beef',             serving_size: '3 oz',      nutrition: { calories: 170, g_protein: 15, g_carbs: 3, g_fat: 10, g_sugar: 0, mg_sodium: 380 } },
          { name: 'Black Beans',                      serving_size: '0.25 cup',  nutrition: { calories: 57, g_protein: 4, g_carbs: 10, g_fat: 0, g_sugar: 0, mg_sodium: 115 } },
        ],
      },
      {
        label: 'Choose Your Toppings',
        items: [
          { name: 'Pico de Gallo',                    serving_size: '2 Tbsp',    nutrition: { calories: 5, g_protein: 0, g_carbs: 1, g_fat: 0, g_sugar: 1, mg_sodium: 65 } },
          { name: 'Sour Cream',                       serving_size: '1 Tbsp',    nutrition: { calories: 23, g_protein: 0, g_carbs: 1, g_fat: 2, g_sugar: 0, mg_sodium: 6 } },
          { name: 'Shredded Cheese',                  serving_size: '1 Tbsp',    nutrition: { calories: 28, g_protein: 2, g_carbs: 0, g_fat: 2, g_sugar: 0, mg_sodium: 44 } },
          { name: 'Guacamole',                        serving_size: '2 Tbsp',    nutrition: { calories: 50, g_protein: 1, g_carbs: 3, g_fat: 4.5, g_sugar: 0, mg_sodium: 115 } },
          { name: 'Salsa Verde',                      serving_size: '2 Tbsp',    nutrition: { calories: 10, g_protein: 0, g_carbs: 2, g_fat: 0, g_sugar: 1, mg_sodium: 190 } },
          { name: 'Shredded Lettuce',                 serving_size: '0.25 cup',  nutrition: { calories: 3, g_protein: 0, g_carbs: 1, g_fat: 0, g_sugar: 0, mg_sodium: 2 } },
        ],
      },
    ],
  },

  // ─── Build Your Own Pasta Bar (Carsons) ─────────────────────────
  7633: {
    name: 'Build Your Own Pasta Bar (Carsons)',
    categories: [
      {
        label: 'Choose Your Pasta',
        items: [
          { name: 'Penne Pasta',                       serving_size: '1 cup',     nutrition: { calories: 200, g_protein: 7, g_carbs: 42, g_fat: 1, g_sugar: 2, mg_sodium: 1 } },
          { name: 'Spaghetti',                         serving_size: '1 cup',     nutrition: { calories: 220, g_protein: 8, g_carbs: 43, g_fat: 1, g_sugar: 1, mg_sodium: 1 } },
          { name: 'Rotini Pasta',                      serving_size: '1 cup',     nutrition: { calories: 210, g_protein: 7, g_carbs: 42, g_fat: 1, g_sugar: 2, mg_sodium: 1 } },
          { name: 'Gluten Free Penne',                 serving_size: '1 cup',     nutrition: { calories: 190, g_protein: 4, g_carbs: 43, g_fat: 1, g_sugar: 0, mg_sodium: 5 } },
        ],
      },
      {
        label: 'Choose Your Sauce',
        items: [
          { name: 'Marinara Sauce',                    serving_size: '0.5 cup',   nutrition: { calories: 70, g_protein: 2, g_carbs: 10, g_fat: 2, g_sugar: 6, mg_sodium: 480 } },
          { name: 'Alfredo Sauce',                     serving_size: '0.25 cup',  nutrition: { calories: 110, g_protein: 2, g_carbs: 3, g_fat: 10, g_sugar: 1, mg_sodium: 380 } },
          { name: 'Pesto Sauce',                       serving_size: '2 Tbsp',    nutrition: { calories: 80, g_protein: 2, g_carbs: 2, g_fat: 7, g_sugar: 0, mg_sodium: 230 } },
          { name: 'Olive Oil & Garlic',                serving_size: '1 Tbsp',    nutrition: { calories: 120, g_protein: 0, g_carbs: 0, g_fat: 14, g_sugar: 0, mg_sodium: 0 } },
        ],
      },
      {
        label: 'Choose Your Protein',
        items: [
          { name: 'Grilled Chicken',                   serving_size: '3 oz',      nutrition: { calories: 130, g_protein: 20, g_carbs: 0, g_fat: 5, g_sugar: 0, mg_sodium: 60 } },
          { name: 'Italian Sausage',                   serving_size: '1 link',    nutrition: { calories: 200, g_protein: 13, g_carbs: 2, g_fat: 16, g_sugar: 1, mg_sodium: 550 } },
          { name: 'Meatballs',                         serving_size: '2 each',    nutrition: { calories: 160, g_protein: 12, g_carbs: 6, g_fat: 10, g_sugar: 1, mg_sodium: 420 } },
        ],
      },
      {
        label: 'Choose Your Toppings',
        items: [
          { name: 'Parmesan Cheese',                   serving_size: '1 Tbsp',    nutrition: { calories: 22, g_protein: 2, g_carbs: 0, g_fat: 1.5, g_sugar: 0, mg_sodium: 76 } },
          { name: 'Red Pepper Flakes',                 serving_size: '0.5 tsp',   nutrition: { calories: 3, g_protein: 0, g_carbs: 1, g_fat: 0, g_sugar: 0, mg_sodium: 0 } },
          { name: 'Sauteed Mushrooms',                 serving_size: '0.25 cup',  nutrition: { calories: 14, g_protein: 1, g_carbs: 2, g_fat: 0.5, g_sugar: 1, mg_sodium: 2 } },
          { name: 'Roasted Broccoli',                  serving_size: '0.25 cup',  nutrition: { calories: 15, g_protein: 1, g_carbs: 2, g_fat: 0.5, g_sugar: 0, mg_sodium: 8 } },
          { name: 'Garlic Bread',                      serving_size: '1 slice',   nutrition: { calories: 150, g_protein: 3, g_carbs: 18, g_fat: 7, g_sugar: 1, mg_sodium: 240 } },
        ],
      },
    ],
  },

  // ─── Build Your Own Stir Fry ─────────────────────────────────────
  4784: {
    name: 'Build Your Own Stir Fry',
    categories: [
      {
        label: 'Choose Your Base',
        items: [
          { name: 'White Rice',                       serving_size: '0.5 cup',   nutrition: { calories: 103, g_protein: 2, g_carbs: 22, g_fat: 0, g_sugar: 0, mg_sodium: 0 } },
          { name: 'Brown Rice',                       serving_size: '0.5 cup',   nutrition: { calories: 108, g_protein: 3, g_carbs: 22, g_fat: 1, g_sugar: 0, mg_sodium: 5 } },
          { name: 'Lo Mein Noodles',                  serving_size: '0.5 cup',   nutrition: { calories: 120, g_protein: 4, g_carbs: 22, g_fat: 2, g_sugar: 1, mg_sodium: 100 } },
        ],
      },
      {
        label: 'Choose Your Protein',
        items: [
          { name: 'Chicken',                          serving_size: '3 oz',      nutrition: { calories: 130, g_protein: 20, g_carbs: 0, g_fat: 5, g_sugar: 0, mg_sodium: 60 } },
          { name: 'Tofu',                             serving_size: '3 oz',      nutrition: { calories: 80, g_protein: 9, g_carbs: 2, g_fat: 4, g_sugar: 0, mg_sodium: 10 } },
        ],
      },
      {
        label: 'Choose Your Veggies',
        items: [
          { name: 'Broccoli',                         serving_size: '0.25 cup',  nutrition: { calories: 8, g_protein: 1, g_carbs: 2, g_fat: 0, g_sugar: 0, mg_sodium: 8 } },
          { name: 'Snow Peas',                        serving_size: '0.25 cup',  nutrition: { calories: 13, g_protein: 1, g_carbs: 2, g_fat: 0, g_sugar: 1, mg_sodium: 1 } },
          { name: 'Bell Peppers',                     serving_size: '0.25 cup',  nutrition: { calories: 8, g_protein: 0, g_carbs: 2, g_fat: 0, g_sugar: 1, mg_sodium: 1 } },
          { name: 'Mushrooms',                        serving_size: '0.25 cup',  nutrition: { calories: 5, g_protein: 1, g_carbs: 1, g_fat: 0, g_sugar: 0, mg_sodium: 1 } },
          { name: 'Carrots',                          serving_size: '0.25 cup',  nutrition: { calories: 13, g_protein: 0, g_carbs: 3, g_fat: 0, g_sugar: 2, mg_sodium: 17 } },
        ],
      },
      {
        label: 'Choose Your Sauce',
        items: [
          { name: 'Teriyaki Sauce',                   serving_size: '1 Tbsp',    nutrition: { calories: 16, g_protein: 1, g_carbs: 3, g_fat: 0, g_sugar: 3, mg_sodium: 610 } },
          { name: 'Soy Sauce',                        serving_size: '1 Tbsp',    nutrition: { calories: 9, g_protein: 1, g_carbs: 1, g_fat: 0, g_sugar: 0, mg_sodium: 879 } },
          { name: 'Sweet Chili Sauce',                serving_size: '1 Tbsp',    nutrition: { calories: 40, g_protein: 0, g_carbs: 10, g_fat: 0, g_sugar: 9, mg_sodium: 190 } },
        ],
      },
    ],
  },

  // ─── Build Your Own Poke Bar ─────────────────────────────────────
  4747: {
    name: 'Build Your Own Poke Bar',
    categories: [
      {
        label: 'Choose Your Base',
        items: [
          { name: 'Quinoa',                           serving_size: '0.5 cup',   nutrition: { calories: 111, g_protein: 4, g_carbs: 20, g_fat: 2, g_sugar: 0, mg_sodium: 7 } },
          { name: 'Wild Rice',                        serving_size: '0.5 cup',   nutrition: { calories: 83, g_protein: 3, g_carbs: 18, g_fat: 0, g_sugar: 0, mg_sodium: 3 } },
          { name: 'Vermicelli Bean Thread Noodles',   serving_size: '0.67 cup',  nutrition: { calories: 120, g_protein: 0, g_carbs: 30, g_fat: 0, g_sugar: 0, mg_sodium: 5 } },
        ],
      },
      {
        label: 'Choose Your Toppings',
        items: [
          { name: 'Bean Sprouts',                     serving_size: '0.25 cup',  nutrition: { calories: 6, g_protein: 1, g_carbs: 1, g_fat: 0, g_sugar: 0, mg_sodium: 2 } },
          { name: 'Daikon Carrot Salad',              serving_size: '0.5 cup',   nutrition: { calories: 25, g_protein: 0, g_carbs: 6, g_fat: 0, g_sugar: 4, mg_sodium: 15 } },
          { name: 'Green Dragon Root Veggie Mix',     serving_size: '0.5 cup',   nutrition: { calories: 30, g_protein: 1, g_carbs: 6, g_fat: 0.5, g_sugar: 2, mg_sodium: 120 } },
          { name: 'Kale',                             serving_size: '0.5 cup',   nutrition: { calories: 18, g_protein: 1, g_carbs: 3, g_fat: 0, g_sugar: 0, mg_sodium: 14 } },
          { name: 'Marinated Teriyaki Tofu',          serving_size: '0.67 cup',  nutrition: { calories: 120, g_protein: 12, g_carbs: 6, g_fat: 5, g_sugar: 3, mg_sodium: 380 } },
          { name: 'Shelled Edamame',                  serving_size: '0.125 cup', nutrition: { calories: 47, g_protein: 4, g_carbs: 4, g_fat: 2, g_sugar: 1, mg_sodium: 2 } },
          { name: 'Roasted & Salted Chickpeas',       serving_size: '0.25 cup',  nutrition: { calories: 120, g_protein: 5, g_carbs: 18, g_fat: 3, g_sugar: 1, mg_sodium: 160 } },
          { name: 'Sunflower Seeds',                  serving_size: '1 Tbsp',    nutrition: { calories: 51, g_protein: 2, g_carbs: 2, g_fat: 4.5, g_sugar: 0, mg_sodium: 1 } },
          { name: 'Green Goddess Dressing',           serving_size: '0.25 cup',  nutrition: { calories: 120, g_protein: 1, g_carbs: 2, g_fat: 12, g_sugar: 1, mg_sodium: 290 } },
          { name: 'Maple Tahini Dressing',            serving_size: '0.5 cup',   nutrition: { calories: 180, g_protein: 3, g_carbs: 12, g_fat: 14, g_sugar: 8, mg_sodium: 150 } },
        ],
      },
    ],
  },
};

const BYO_NAME_MAP = {};
for (const [id, data] of Object.entries(BYO_COMPONENTS)) {
  BYO_NAME_MAP[data.name.toLowerCase()] = { id: Number(id), ...data };
}

function getBYOComponents(foodId, foodName) {
  if (BYO_COMPONENTS[foodId]) return BYO_COMPONENTS[foodId];
  if (foodName) {
    const key = foodName.toLowerCase().trim();
    if (BYO_NAME_MAP[key]) return BYO_NAME_MAP[key];
    for (const [pattern, data] of Object.entries(BYO_NAME_MAP)) {
      if (key.includes(pattern) || pattern.includes(key)) return data;
    }
  }
  return null;
}

function getAllBYOIds() {
  return new Set(Object.keys(BYO_COMPONENTS).map(Number));
}

const _subNameSet = new Set();
for (const data of Object.values(BYO_COMPONENTS)) {
  for (const cat of data.categories) {
    for (const item of cat.items) {
      _subNameSet.add(item.name.toLowerCase());
    }
  }
}

const _alwaysByoPattern = /greek yogurt|coconut milk yogurt/i;

function isBYOSubName(foodName, ignoreStation = false) {
  if (!foodName) return false;
  if (ignoreStation && _alwaysByoPattern.test(foodName)) return true;
  const key = foodName.toLowerCase().replace(/\s*\(.*?\)\s*/g, "").trim();
  return _subNameSet.has(key);
}

module.exports = { getBYOComponents, getAllBYOIds, isBYOSubName, BYO_COMPONENTS };
