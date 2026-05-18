const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  ulb_name: String,
  ulb_type: String,
  district: String,
  state: { type: String, default: "Karnataka" },
  website: String,
  office_phone: String,
  office_email: String,
  office_address: String,
  commissioner_name: String,
  commissioner_designation: String,
  source_url: String,
  confidence_score: Number,
  verification_status: { type: String, default: "Unverified" },
  last_verified_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ulbs_master", schema, "ulbs_master");
