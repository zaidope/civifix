const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  ulb_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ulbs_master' },
  department: String,
  designation: String,
  officer_name: String,
  phone: String,
  alternate_phone: String,
  email: String,
  office_address: String,
  jurisdiction: String,
  ward: String,
  source_url: String,
  confidence_score: Number,
  verification_status: { type: String, default: "Unverified" },
  last_verified_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ulb_officials", schema, "ulb_officials");
