const mongoose = require("mongoose");

const zoneSchema = new mongoose.Schema({
  zone_id: { type: String, unique: true },
  display_name: { type: String, default: "Unknown Area" },
  center_lat: Number,
  center_lon: Number,
  total_issues: { type: Number, default: 0 },
  high_priority_count: { type: Number, default: 0 },
  medium_priority_count: { type: Number, default: 0 },
  low_priority_count: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  last_updated: { type: Date, default: Date.now },
});

module.exports = mongoose.model("zones", zoneSchema);
