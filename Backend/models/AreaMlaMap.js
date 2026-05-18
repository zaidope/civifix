const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  area_name: { type: String, required: true },
  ward_name: String,
  pincode: String,
  constituency: String, // e.g., "Mahadevapura"
  mla_id: { type: mongoose.Schema.Types.ObjectId, ref: "mlas_master" },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

schema.index({ area_name: 1 });
schema.index({ pincode: 1 });
schema.index({ constituency: 1 });

module.exports = mongoose.model("area_mla_maps", schema, "area_mla_maps");
