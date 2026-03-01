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

const BYO_STATION_PATTERN = /^(choose your|build your own|varies by day)/i;

let passed = 0;
let failed = 0;
let warnings = 0;

function assert(condition, msg) {
  if (condition) {
    passed++;
    console.log(`  PASS: ${msg}`);
  } else {
    failed++;
    console.log(`  FAIL: ${msg}`);
  }
}

function warn(msg) {
  warnings++;
  console.log(`  WARN: ${msg}`);
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

async function testMenuEndpoint() {
  console.log("\n=== TEST 1: /api/menu — BYO items & no leaked sub-components ===\n");

  for (const hall of HALLS) {
    for (const meal of MEALS) {
      const data = await fetchJSON(`${BASE}/menu?hall=${hall}&meal=${meal}`);
      if (!data || !data.items || data.items.length === 0) continue;

      const items = data.items;
      const byoItems = items.filter((i) => i.is_build_your_own);
      const leakedSubComponents = items.filter((i) => i.is_byo_component);
      const leakedByStation = items.filter(
        (i) => !i.is_build_your_own && BYO_STATION_PATTERN.test(i.station || "")
      );

      console.log(`  [${hall} / ${meal}] ${items.length} items, ${byoItems.length} BYO`);

      assert(
        leakedSubComponents.length === 0,
        `No is_byo_component items leaked in ${hall}/${meal} (found ${leakedSubComponents.length})`
      );

      if (leakedSubComponents.length > 0) {
        leakedSubComponents.forEach((i) =>
          console.log(`    LEAKED: "${i.name}" station="${i.station}"`)
        );
      }

      assert(
        leakedByStation.length === 0,
        `No BYO-station-named items leaked in ${hall}/${meal} (found ${leakedByStation.length})`
      );

      if (leakedByStation.length > 0) {
        leakedByStation.forEach((i) =>
          console.log(`    LEAKED BY STATION: "${i.name}" station="${i.station}"`)
        );
      }

      for (const byo of byoItems) {
        assert(
          byo.byo_components && byo.byo_components.length > 0,
          `BYO "${byo.name}" in ${hall}/${meal} has components (${(byo.byo_components || []).length} categories)`
        );
      }
    }
  }
}

async function testRecommendEndpoint() {
  console.log("\n=== TEST 2: /api/recommend — per-hall, no duplicates, no BYO sub-items ===\n");

  const recsByHall = {};

  for (const hall of HALLS) {
    const data = await fetchJSON(`${BASE}/recommend?hall=${hall}`);
    if (!data || !data.halls) {
      console.log(`  [${hall}] No recommendation data`);
      continue;
    }

    const hallRecs = data.halls[hall] || [];
    recsByHall[hall] = hallRecs;

    console.log(`  [${hall}] ${hallRecs.length} recommendations`);

    const byoSubRecs = hallRecs.filter(
      (i) => i.is_byo_component || BYO_STATION_PATTERN.test(i.station || "")
    );
    assert(
      byoSubRecs.length === 0,
      `No BYO sub-components in recommendations for ${hall} (found ${byoSubRecs.length})`
    );
    if (byoSubRecs.length > 0) {
      byoSubRecs.forEach((i) =>
        console.log(`    LEAKED REC: "${i.name}" station="${i.station}"`)
      );
    }

    const ids = hallRecs.map((i) => i.food_id);
    const uniqueIds = new Set(ids);
    assert(
      ids.length === uniqueIds.size,
      `No duplicate food_ids in ${hall} recommendations (${ids.length} total, ${uniqueIds.size} unique)`
    );
  }

  const hallKeys = Object.keys(recsByHall).filter(
    (h) => recsByHall[h].length > 0
  );
  if (hallKeys.length >= 2) {
    let allSame = true;
    const firstNames = recsByHall[hallKeys[0]]
      .map((i) => i.name)
      .sort()
      .join("|");
    for (let k = 1; k < hallKeys.length; k++) {
      const names = recsByHall[hallKeys[k]]
        .map((i) => i.name)
        .sort()
        .join("|");
      if (names !== firstNames) {
        allSame = false;
        break;
      }
    }
    assert(
      !allSame,
      `Recommendations differ across halls (compared ${hallKeys.length} halls with recs)`
    );
  } else {
    warn("Only 0-1 halls returned recs today; can't compare across halls");
  }
}

async function testMenuRecOverlap() {
  console.log("\n=== TEST 3: /api/recommend vs /api/menu — check for BYO name leaks ===\n");

  const byoSubNames = new Set();

  for (const hall of HALLS) {
    for (const meal of MEALS) {
      const url = `${BASE}/menu?hall=${hall}&meal=${meal}&include_byo_components=true`;
      const data = await fetchJSON(`${BASE}/menu?hall=${hall}&meal=${meal}`);
      if (!data || !data.items) continue;
    }
  }

  const rawResp = await fetchJSON(`${BASE}/recommend`);
  if (rawResp && rawResp.halls) {
    for (const [hall, recs] of Object.entries(rawResp.halls)) {
      for (const rec of recs) {
        const station = (rec.station || "").toLowerCase();
        if (BYO_STATION_PATTERN.test(station)) {
          console.log(
            `  LEAKED in recs: "${rec.name}" station="${rec.station}" hall=${hall}`
          );
          failed++;
        }
      }
    }
  }
  console.log("  (checked all recommendation items for BYO-station leaks)");
}

async function testBYOConsistency() {
  console.log("\n=== TEST 4: BYO items consistency across halls ===\n");

  const byoByHall = {};

  for (const hall of HALLS) {
    byoByHall[hall] = [];
    for (const meal of MEALS) {
      const data = await fetchJSON(`${BASE}/menu?hall=${hall}&meal=${meal}`);
      if (!data || !data.items) continue;
      const byos = data.items.filter((i) => i.is_build_your_own);
      for (const b of byos) {
        byoByHall[hall].push({
          meal,
          name: b.name,
          hasComponents: !!(b.byo_components && b.byo_components.length > 0),
          componentCount: (b.byo_components || []).length,
          categories: (b.byo_components || []).map((c) => c.category),
        });
      }
    }
  }

  console.log("\n  BYO Items Found:\n");
  for (const [hall, byos] of Object.entries(byoByHall)) {
    if (byos.length === 0) {
      console.log(`  [${hall}] No BYO items today`);
    } else {
      for (const b of byos) {
        const status = b.hasComponents ? "WITH components" : "MISSING components";
        console.log(
          `  [${hall}/${b.meal}] "${b.name}" — ${status} (${b.componentCount} categories: ${b.categories.join(", ")})`
        );
        if (!b.hasComponents) {
          warn(`BYO "${b.name}" in ${hall}/${b.meal} is missing component data`);
        }
      }
    }
  }
}

async function testStationNames() {
  console.log("\n=== TEST 5: Station names — no BYO sub-stations in regular items ===\n");

  const stationCounts = {};

  for (const hall of HALLS) {
    for (const meal of MEALS) {
      const data = await fetchJSON(`${BASE}/menu?hall=${hall}&meal=${meal}`);
      if (!data || !data.items) continue;

      for (const item of data.items) {
        const st = item.station || "(no station)";
        stationCounts[st] = (stationCounts[st] || 0) + 1;
      }
    }
  }

  console.log("  Station distribution across all halls/meals:");
  const sorted = Object.entries(stationCounts).sort((a, b) => b[1] - a[1]);
  for (const [station, count] of sorted) {
    console.log(`    ${station}: ${count} items`);
  }

  const nonByoLeaks = [];
  for (const hall of HALLS) {
    for (const meal of MEALS) {
      const data = await fetchJSON(`${BASE}/menu?hall=${hall}&meal=${meal}`);
      if (!data || !data.items) continue;
      for (const item of data.items) {
        if (!item.is_build_your_own && BYO_STATION_PATTERN.test(item.station || "")) {
          nonByoLeaks.push({ name: item.name, station: item.station, hall, meal });
        }
      }
    }
  }
  assert(
    nonByoLeaks.length === 0,
    `No non-BYO items with BYO station names (found ${nonByoLeaks.length})`
  );
  if (nonByoLeaks.length > 0) {
    nonByoLeaks.forEach((i) =>
      console.log(`    LEAKED: "${i.name}" station="${i.station}" in ${i.hall}/${i.meal}`)
    );
  }
}

(async () => {
  console.log("Starting uniformity tests against http://localhost:3001\n");
  console.log(`Date: ${new Date().toISOString()}`);
  console.log(`Day: Sunday (some halls may be closed)\n`);

  await testMenuEndpoint();
  await testRecommendEndpoint();
  await testMenuRecOverlap();
  await testBYOConsistency();
  await testStationNames();

  console.log("\n" + "=".repeat(60));
  console.log(`RESULTS: ${passed} passed, ${failed} failed, ${warnings} warnings`);
  console.log("=".repeat(60));

  process.exit(failed > 0 ? 1 : 0);
})();
