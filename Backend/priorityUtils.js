const axios = require("axios");

// Haversine distance between two lat/lon points in meters
function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371000; // Earth radius in meters

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
 * Calculate bounding box severity level (1–3) based on its area
 * relative to the full image area.
 *
 * @param {Object} options
 * @param {Object} options.bbox - Bounding box with x1, y1, x2, y2
 * @param {number} options.imageWidth - Image width in pixels
 * @param {number} options.imageHeight - Image height in pixels
 * @returns {number} severityLevel (1, 2, 3)
 */
function calculate_bbox_severity({ bbox, imageWidth, imageHeight }) {
  if (
    !bbox ||
    typeof bbox.x1 !== "number" ||
    typeof bbox.y1 !== "number" ||
    typeof bbox.x2 !== "number" ||
    typeof bbox.y2 !== "number" ||
    !imageWidth ||
    !imageHeight
  ) {
    // Deterministic fallback when we do not have geometry data
    return 1;
  }

  const boxWidth = Math.max(0, bbox.x2 - bbox.x1);
  const boxHeight = Math.max(0, bbox.y2 - bbox.y1);
  const boxArea = boxWidth * boxHeight;
  const imageArea = imageWidth * imageHeight || 1;

  const severityRatio = boxArea / imageArea;

  if (severityRatio < 0.05) return 1;
  if (severityRatio < 0.15) return 2;
  return 3;
}

/**
 * Count nearby duplicate complaints within 200m radius
 * for the same category and unresolved status.
 *
 * @param {Object} ComplaintModel - Mongoose model for complaints
 * @param {Object} options
 * @param {string} options.category - Complaint category / issue type
 * @param {number} options.latitude
 * @param {number} options.longitude
 * @returns {Promise<{ duplicateCount: number, duplicatePriority: number }>}
 */
async function count_nearby_duplicates(ComplaintModel, { category, latitude, longitude }) {
  if (
    !ComplaintModel ||
    !category ||
    typeof latitude !== "number" ||
    typeof longitude !== "number"
  ) {
    return { duplicateCount: 0, duplicatePriority: 0 };
  }

  // Fetch complaints with same category that are not resolved.
  // We avoid using MongoDB geo indexes to keep this deterministic and portable.
  // OPTIMIZATION: Use a bounding box to pre-filter points within ~250m before in-memory Haversine loop.
  // 1 degree latitude is approx 111km. 200m is ~0.0018 degrees.
  const latDelta = 0.002;
  const lonDelta = 0.002;
  const existing = await ComplaintModel.find({
    category,
    status: { $ne: "Resolved" },
    latitude: { $gte: latitude - latDelta, $lte: latitude + latDelta },
    longitude: { $gte: longitude - lonDelta, $lte: longitude + lonDelta },
  }).lean();

  let duplicateCount = 0;
  for (const c of existing) {
    if (typeof c.latitude !== "number" || typeof c.longitude !== "number") {
      continue;
    }
    const dist = haversineDistanceMeters(latitude, longitude, c.latitude, c.longitude);
    if (dist <= 200) {
      duplicateCount += 1;
    }
  }

  let duplicatePriority = 0;
  if (duplicateCount >= 1 && duplicateCount <= 3) {
    duplicatePriority = 1;
  } else if (duplicateCount >= 4 && duplicateCount <= 7) {
    duplicatePriority = 2;
  } else if (duplicateCount > 7) {
    duplicatePriority = 3;
  }

  return { duplicateCount, duplicatePriority };
}

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const MAJOR_ROADS = new Set(["motorway", "primary", "trunk", "secondary"]);

/**
 * Determine if a point lies on or near a major road using OpenStreetMap data.
 *
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<{ isMainRoad: boolean, roadPriority: number }>}
 */
async function check_main_road(latitude, longitude) {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return { isMainRoad: false, roadPriority: 0 };
  }

  const radiusMeters = 50; // small radius around the point
  const query = `
    [out:json][timeout:10];
    (
      way(around:${radiusMeters},${latitude},${longitude})["highway"];
    );
    out tags center;
  `;

  try {
    const response = await axios.post(
      OVERPASS_URL,
      `data=${encodeURIComponent(query)}`,
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 8000,
      }
    );

    const elements = (response.data && response.data.elements) || [];
    for (const el of elements) {
      const highway = el.tags && el.tags.highway;
      if (highway && MAJOR_ROADS.has(highway)) {
        return { isMainRoad: true, roadPriority: 2 };
      }
    }

    return { isMainRoad: false, roadPriority: 0 };
  } catch (err) {
    // On network/API failure, return deterministic fallback with no road bonus
    return { isMainRoad: false, roadPriority: 0 };
  }
}

/**
 * Calculate final priority score and human-readable priority level.
 *
 * priority_score = (base_severity * 2) + duplicate_priority + road_priority
 *
 * @param {Object} options
 * @param {number} options.baseSeverity
 * @param {number} options.duplicatePriority
 * @param {number} options.roadPriority
 * @returns {{ priorityScore: number, priorityLevel: string }}
 */
function calculate_priority_score({ baseSeverity, duplicatePriority, roadPriority }) {
  const safeBase = Number.isFinite(baseSeverity) ? baseSeverity : 1;
  const safeDup = Number.isFinite(duplicatePriority) ? duplicatePriority : 0;
  const safeRoad = Number.isFinite(roadPriority) ? roadPriority : 0;

  const priorityScore = safeBase * 2 + safeDup + safeRoad;

  let priorityLevel = "LOW";
  if (priorityScore > 2 && priorityScore <= 5) {
    priorityLevel = "MEDIUM";
  } else if (priorityScore > 5) {
    priorityLevel = "HIGH";
  }

  return { priorityScore, priorityLevel };
}

module.exports = {
  calculate_bbox_severity,
  count_nearby_duplicates,
  check_main_road,
  calculate_priority_score,
};

