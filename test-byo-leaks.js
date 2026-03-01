const BASE = "http://localhost:3001/api";
const HALLS = [
  "gordon-avenue-market",
  "four-lakes-market",
  "rhetas-market",
  "lizs-market",
  "carsons-market",
  "lowell-market",
];
const MEALS = ["breakfast", "lunch", "dinner"];

const BYO_SUB_NAMES = new Set([
  "non fat plain greek yogurt","vanilla greek yogurt","vanilla coconut milk yogurt",
  "strawberries","blueberries","craisins","sweetened coconut flakes","chocolate chips","vanilla granola",
  "spring mix greens","lettuce & romaine mix","spinach","cottage cheese","cheddar cheese","hard cooked egg",
  "hummus","broccoli florets","carrots","cucumber","mushrooms","sliced red onion","green pepper",
  "grape tomatoes","sunflower seeds","homestyle croutons","bacon bits",
  'tortilla - whole wheat (12")','flour tortilla','tortilla - spinach herb (12")','croissant','pretzel bun',
  "french roll","wheat sub roll","multigrain bread","gluten free white bread","gluten free multigrain bread",
  "gluten free tortilla","oven roasted turkey","roast beef","smoked ham","pork & beef hard salami",
  "pepper jack cheese","provolone cheese","vegan smoked gouda","swiss cheese",
  "pickle chips","banana peppers","iceberg lettuce","sliced tomato","avocado","bacon","giardiniera",
  "chipotle mayonnaise","dijon mustard","mayonnaise","pesto mayonnaise","sweet & spicy boom boom sauce",
  "yellow mustard","ruffle potato chips",
  "english muffin","scrambled eggs","sausage patty","american cheese",
  "cilantro lime rice","tortilla chips","seasoned chicken","seasoned ground beef","black beans",
  "pico de gallo","sour cream","shredded cheese","guacamole","salsa verde","shredded lettuce",
  "white rice","brown rice","lo mein noodles","chicken","tofu","broccoli","snow peas","bell peppers",
  "teriyaki sauce","soy sauce","sweet chili sauce",
  "quinoa","wild rice","vermicelli bean thread noodles","bean sprouts","daikon carrot salad",
  "green dragon root veggie mix","kale","marinated teriyaki tofu","shelled edamame",
  "roasted & salted chickpeas","green goddess dressing","maple tahini dressing",
  "penne pasta","spaghetti","rotini pasta","gluten free penne","marinara sauce","alfredo sauce",
  "pesto sauce","olive oil & garlic","grilled chicken","italian sausage","meatballs",
  "parmesan cheese","red pepper flakes","sauteed mushrooms","roasted broccoli","garlic bread",
]);

function normalize(name) {
  return (name || "").toLowerCase().replace(/\s*\(.*?\)\s*/g, "").trim();
}

(async () => {
  console.log("=== BYO Sub-Item Leak Detection ===\n");

  let totalLeaks = 0;

  for (const hall of HALLS) {
    console.log(`\n--- ${hall} ---`);
    let hallHasData = false;

    for (const meal of MEALS) {
      const res = await fetch(`${BASE}/menu?hall=${hall}&meal=${meal}`);
      const data = await res.json();
      if (!data.items || data.items.length === 0) continue;
      hallHasData = true;

      const byoItems = data.items.filter((i) => i.is_build_your_own);
      const regularItems = data.items.filter((i) => !i.is_build_your_own);

      const leaked = regularItems.filter((i) =>
        BYO_SUB_NAMES.has(normalize(i.name))
      );

      const byoNames = byoItems.map((i) => i.name);

      console.log(
        `  [${meal}] ${data.items.length} items | BYO: ${byoNames.join(", ") || "none"}`
      );

      if (leaked.length > 0) {
        totalLeaks += leaked.length;
        console.log(`    ** ${leaked.length} LEAKED sub-items:`);
        leaked.forEach((i) =>
          console.log(
            `       - "${i.name}" (station: ${i.station || "none"}, cal: ${i.nutrition?.calories || "?"})`
          )
        );
      }
    }

    if (!hallHasData) console.log("  (closed today)");
  }

  console.log("\n" + "=".repeat(60));

  if (totalLeaks === 0) {
    console.log("ALL CLEAN: No BYO sub-items leaked into any market menu.");
  } else {
    console.log(`FOUND ${totalLeaks} leaked BYO sub-items across all markets.`);
  }

  console.log("=".repeat(60));

  // Now check what BYO stations each hall SHOULD have
  console.log("\n\n=== BYO Station Coverage Per Market ===\n");
  console.log("Expected BYO types: Yogurt Bar, Sandwich, Breakfast Sandwich, Salad, Que Rico, Pasta Bar, Stir Fry, Poke Bar\n");

  const BYO_TYPES = [
    "Yogurt Bar",
    "Sandwich",
    "Breakfast Sandwich",
    "Salad",
    "Que Rico",
    "Pasta Bar",
    "Stir Fry",
    "Poke Bar",
  ];

  for (const hall of HALLS) {
    console.log(`--- ${hall} ---`);
    for (const meal of MEALS) {
      const res = await fetch(`${BASE}/menu?hall=${hall}&meal=${meal}`);
      const data = await res.json();
      if (!data.items || data.items.length === 0) continue;

      const byoItems = data.items.filter((i) => i.is_build_your_own);
      if (byoItems.length === 0) {
        console.log(`  [${meal}] No BYO stations`);
        continue;
      }

      const found = [];
      const missing = [];
      for (const byo of byoItems) {
        const hasComps = byo.byo_components && byo.byo_components.length > 0;
        found.push(`${byo.name} ${hasComps ? "OK" : "MISSING DATA"}`);
      }
      console.log(`  [${meal}] ${found.join(" | ")}`);
    }
  }

  process.exit(totalLeaks > 0 ? 1 : 0);
})();
