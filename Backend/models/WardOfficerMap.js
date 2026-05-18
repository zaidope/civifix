const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  ulb_id: { type: mongoose.Schema.Types.ObjectId, ref: "ulbs_master", required: true },
  ward_name: String,
  ward_number: String,
  department: { type: String, required: true }, // e.g., "Sanitation", "Engineering"
  officer_id: { type: mongoose.Schema.Types.ObjectId, ref: "ulb_officials" },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

schema.index({ ulb_id: 1, department: 1, ward_name: 1 });

module.exports = mongoose.model("ward_officer_maps", schema, "ward_officer_maps");
