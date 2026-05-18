const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  area_name: { type: String, required: true }, // e.g., "Bellandur"
  ward_name: String,
  ward_number: String,
  pincode: String,
  ulb_id: { type: mongoose.Schema.Types.ObjectId, ref: "ulbs_master" },
  ulb_name: String, // Denormalized for faster lookup
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Index for fast lookups by area, ward, or pincode
schema.index({ area_name: 1 });
schema.index({ pincode: 1 });
schema.index({ ward_name: 1 });

module.exports = mongoose.model("area_ulb_maps", schema, "area_ulb_maps");
