const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  name: String,
  constituency: String,
  constituency_number: { type: Number, unique: true },
  district: String,
  party: String,
  phone_numbers: [String],
  landline_numbers: [String],
  email: String,
  address: String,
  source_url: String,
  confidence_score: Number,
  verification_status: { type: String, default: "Unverified" },
  last_verified_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("mlas_master", schema, "mlas_master");
