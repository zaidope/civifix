/**
 * Polygon Resolver Service
 * 
 * Uses MongoDB 2dsphere indexes to perform authoritative
 * point-in-polygon lookups against ward, assembly constituency,
 * and parliamentary constituency boundaries.
 * 
 * This is the PRIMARY civic resolver — Nominatim is ONLY for display names.
 */
const WardBoundary = require("../models/WardBoundary");
const ElectedRepresentative = require("../models/ElectedRepresentative");

// In-memory cache for resolved ward lookups (key: "lat,lng" rounded to 4 decimals)
const wardCache = new Map();
const CACHE_MAX = 5000;

/**
 * Round a coordinate to 4 decimal places (~11m precision).
 * This creates a cache key that prevents redundant DB queries.
 */
function cacheKey(lat, lng) {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

/**
 * PRIMARY RESOLVER: Given lat/lng, find the ward using point-in-polygon.
 * Returns the ward document with all civic geography fields.
 * 
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<Object|null>} Ward document or null
 */
async function resolveWard(lat, lng) {
  if (typeof lat !== "number" || typeof lng !== "number") return null;

  const key = cacheKey(lat, lng);
  if (wardCache.has(key)) return wardCache.get(key);

  try {
    // MongoDB $geoIntersects finds which polygon contains this point
    const ward = await WardBoundary.findOne({
      boundary: {
        $geoIntersects: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat] // GeoJSON is [longitude, latitude]
          }
        }
      }
    }).lean();

    if (ward) {
      // Strip the heavy polygon data from cache
      const cached = {
        ward_no: ward.ward_no,
        ward_name: ward.ward_name,
        ward_name_ka: ward.ward_name_ka,
        zone_name: ward.zone_name,
        assembly_constituency_id: ward.assembly_constituency_id,
        assembly_constituency_name: ward.assembly_constituency_name,
        parliamentary_constituency_id: ward.parliamentary_constituency_id,
        parliamentary_constituency_name: ward.parliamentary_constituency_name,
        population: ward.population
      };

      // Evict oldest if cache is full
      if (wardCache.size >= CACHE_MAX) {
        const firstKey = wardCache.keys().next().value;
        wardCache.delete(firstKey);
      }
      wardCache.set(key, cached);
      return cached;
    }

    return null;
  } catch (err) {
    console.error("Polygon resolver error:", err.message);
    return null;
  }
}

/**
 * Resolve elected representatives for a given ward.
 * Returns corporator, MLA, and MP.
 * 
 * @param {Object} wardData - Output from resolveWard()
 * @returns {Promise<Object>}
 */
async function resolveElectedReps(wardData) {
  if (!wardData) {
    return { corporator: null, mla: null, mp: null };
  }

  const [corporator, mla, mp] = await Promise.all([
    // Corporator: by ward number
    ElectedRepresentative.findOne({
      role: "corporator",
      ward_no: wardData.ward_no
    }).lean(),

    // MLA: by assembly constituency name
    wardData.assembly_constituency_name
      ? ElectedRepresentative.findOne({
          role: "mla",
          constituency_name: new RegExp(
            wardData.assembly_constituency_name.replace(/^\d+-/, "").trim(),
            "i"
          )
        }).lean()
      : null,

    // MP: by parliamentary constituency name
    wardData.parliamentary_constituency_name
      ? ElectedRepresentative.findOne({
          role: "mp",
          constituency_name: new RegExp(
            wardData.parliamentary_constituency_name.trim(),
            "i"
          )
        }).lean()
      : null
  ]);

  return {
    corporator: corporator || {
      name: "Vacant",
      role: "corporator",
      term_status: "vacant",
      ward_no: wardData.ward_no
    },
    mla: mla || {
      name: "Unassigned",
      role: "mla",
      constituency_name: wardData.assembly_constituency_name,
      term_status: "active"
    },
    mp: mp || {
      name: "Unassigned",
      role: "mp",
      constituency_name: wardData.parliamentary_constituency_name,
      term_status: "active"
    }
  };
}

/**
 * Full civic geography resolution from coordinates.
 * This is the single entry point for the accountability chain.
 * 
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<Object>}
 */
async function resolveCivicGeography(lat, lng) {
  const ward = await resolveWard(lat, lng);
  const reps = await resolveElectedReps(ward);

  return {
    ward: ward,
    elected: reps,
    resolved: ward !== null
  };
}

module.exports = {
  resolveWard,
  resolveElectedReps,
  resolveCivicGeography
};
