/**
 * Backfill script: Updates all existing zones that have "Unknown Area"
 * or missing display_name with real area names from Nominatim.
 *
 * Usage: node Backend/scripts/backfill_zone_names.js
 */
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const Zone = require("../models/Zone");
const { reverseGeocodeAreaName } = require("../zonesUtils");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/citizen_grievance";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  console.log("✅ Connected.\n");

  const zones = await Zone.find({
    $or: [
      { display_name: { $exists: false } },
      { display_name: null },
      { display_name: "" },
      { display_name: "Unknown Area" },
    ],
  });

  console.log(`📍 Found ${zones.length} zone(s) to backfill.\n`);

  let updated = 0;
  let failed = 0;

  for (const zone of zones) {
    const { zone_id, center_lat, center_lon } = zone;
    if (typeof center_lat !== "number" || typeof center_lon !== "number") {
      console.log(`  ⚠️  ${zone_id}: No coordinates, skipping.`);
      failed++;
      continue;
    }

    try {
      const name = await reverseGeocodeAreaName(center_lat, center_lon);
      if (name) {
        await Zone.updateOne({ zone_id }, { $set: { display_name: name } });
        console.log(`  ✅ ${zone_id} → "${name}" (${center_lat}, ${center_lon})`);
        updated++;
      } else {
        console.log(`  ⚠️  ${zone_id}: Could not resolve name for (${center_lat}, ${center_lon})`);
        failed++;
      }
    } catch (err) {
      console.log(`  ❌ ${zone_id}: Error — ${err.message}`);
      failed++;
    }

    // Nominatim asks for max 1 request per second
    await sleep(1100);
  }

  console.log(`\n🏁 Done. Updated: ${updated}, Failed: ${failed}`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
