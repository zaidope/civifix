const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  ward_no: { type: Number, required: true, unique: true },
  ward_name: { type: String, required: true },
  ward_name_ka: String,
  boundary: {
    type: { type: String, enum: ["MultiPolygon", "Polygon"], required: true },
    coordinates: { type: mongoose.Schema.Types.Mixed, required: true }
  },
  zone_name: String,
  assembly_constituency_id: Number,
  assembly_constituency_name: String,
  parliamentary_constituency_id: Number,
  parliamentary_constituency_name: String,
  population: Number,
  area_sqkm: Number,
  created_at: { type: Date, default: Date.now }
});

// 2dsphere index for point-in-polygon queries
schema.index({ boundary: "2dsphere" });

module.exports = mongoose.model("ward_boundaries", schema, "ward_boundaries");
