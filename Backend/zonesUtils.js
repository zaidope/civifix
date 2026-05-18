/**
 * Zone utility functions for 2.5 km hotspot clustering.
 *
 * All functions are deterministic and side-effect free, except for the
 * explicit database writes inside zone assignment/stat updates.
 */
const axios = require('axios');


/**
 * Extract the best human-readable area name from a Nominatim response.
 * Tries many fields in priority order, and as a last resort parses
 * the display_name string to extract the most local/specific name.
 *
 * This should NEVER return null if the API returned valid data.
 */
function extractAreaName(data) {
  if (!data) return null;

  const addr = data.address || {};

  // Priority 1: Specific locality-level fields
  const localityFields = [
    addr.suburb,
    addr.neighbourhood,
    addr.quarter,
    addr.hamlet,
    addr.village,
    addr.town,
    addr.city_district,
    addr.residential,
    addr.locality,
    addr.isolated_dwelling,
    addr.croft,
    addr.allotments,
  ];

  for (const val of localityFields) {
    if (val && val.trim()) return val.trim();
  }

  // Priority 2: The POI/place name from Nominatim's top-level "name"
  if (data.name && data.name.trim()) return data.name.trim();

  // Priority 3: Broader administrative fields
  const adminFields = [
    addr.city,
    addr.county,
    addr.municipality,
    addr.state_district,
    addr.state,
  ];

  for (const val of adminFields) {
    if (val && val.trim()) return val.trim();
  }

  // Priority 4: Parse display_name — always present and contains something.
  // display_name looks like: "Place, Road, Area, City, State, Pincode, Country"
  // We take the FIRST meaningful part.
  if (data.display_name) {
    const parts = data.display_name.split(",").map((s) => s.trim());
    const skipPatterns = [
      /^\d+$/,                    // pure numbers
      /^(india|karnataka)$/i,     // country/state
      /^\d{6}$/,                  // Indian pincodes
      /^(NH|SH|MDR)\s*\d/i,      // highway numbers
      /^unnamed\s+road$/i,       // unnamed road
    ];
    for (const part of parts) {
      if (!part) continue;
      const isSkip = skipPatterns.some((re) => re.test(part));
      if (!isSkip && part.length > 1) {
        return part;
      }
    }
  }

  return null;
}

/**
 * Reverse-geocode a lat/lng pair into a human-readable area name.
 * Returns a short, recognizable locality name (e.g. "Hebbal", "Yelahanka").
 * Falls back gracefully through multiple strategies.
 */
async function reverseGeocodeAreaName(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=16&addressdetails=1`;
    const res = await axios.get(url, {
      headers: { "User-Agent": "CiviFix/1.0" },
      timeout: 8000,
    });
    const name = extractAreaName(res.data);
    if (name) return name;
  } catch (err) {
    console.error("Reverse geocoding failed:", err.message);
  }
  return null;
}


/**
 * Calculate distance between two lat/lon points using the Haversine formula.
 * Returns distance in kilometers.
 */
function calculate_distance(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generate a simple unique zone identifier.
 */
function generateZoneId() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `zone_${ts}_${rand}`;
}

/**
 * Assign a complaint location to an existing zone within 2.5 km,
 * or create a new zone centered on the complaint if none matches.
 */
async function assign_or_create_zone(ZoneModel, latitude, longitude) {
  if (
    !ZoneModel ||
    typeof latitude !== "number" ||
    typeof longitude !== "number"
  ) {
    return null;
  }

  const RADIUS_KM = 2.5;
  // OPTIMIZATION: Bounding box query to prevent O(N) full table scan.
  // 1 degree lat is ~111km. 2.5km is ~0.0225 degrees.
  const latDelta = 0.025;
  const lonDelta = 0.025;
  
  const allZones = await ZoneModel.find({
    center_lat: { $gte: latitude - latDelta, $lte: latitude + latDelta },
    center_lon: { $gte: longitude - lonDelta, $lte: longitude + lonDelta }
  }).lean();

  for (const zone of allZones) {
    if (
      typeof zone.center_lat !== "number" ||
      typeof zone.center_lon !== "number"
    ) {
      continue;
    }
    const distKm = calculate_distance(
      latitude,
      longitude,
      zone.center_lat,
      zone.center_lon
    );
    if (distKm <= RADIUS_KM) {
      return zone.zone_id;
    }
  }

  const now = new Date();
  const zone_id = generateZoneId();

  // Resolve a human-readable area name for this new zone
  const display_name = (await reverseGeocodeAreaName(latitude, longitude)) || "Unknown Area";

  await ZoneModel.create({
    zone_id,
    display_name,
    center_lat: latitude,
    center_lon: longitude,
    total_issues: 0,
    high_priority_count: 0,
    medium_priority_count: 0,
    low_priority_count: 0,
    created_at: now,
    last_updated: now,
  });

  return zone_id;
}

/**
 * Update zone statistics for a newly created complaint.
 */
async function update_zone_statistics(ZoneModel, zone_id, priorityLevel) {
  if (!ZoneModel || !zone_id) return;

  const inc = { total_issues: 1 };
  if (priorityLevel === "HIGH") {
    inc.high_priority_count = 1;
  } else if (priorityLevel === "MEDIUM") {
    inc.medium_priority_count = 1;
  } else {
    inc.low_priority_count = 1;
  }

  await ZoneModel.findOneAndUpdate(
    { zone_id },
    {
      $inc: inc,
      $set: { last_updated: new Date() },
    },
    { new: true }
  );
}

module.exports = {
  calculate_distance,
  assign_or_create_zone,
  update_zone_statistics,
  reverseGeocodeAreaName,
  extractAreaName,
};
