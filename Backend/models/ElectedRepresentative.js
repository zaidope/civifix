const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  name: { type: String, required: true },
  role: {
    type: String,
    enum: ["corporator", "mla", "mp"],
    required: true
  },
  ward_no: Number,                      // for corporators
  constituency_name: String,            // for MLA / MP
  constituency_id: Number,              // for MLA / MP
  constituency_type: {                  // assembly = MLA, parliamentary = MP
    type: String,
    enum: ["assembly", "parliamentary", "ward"]
  },
  party: String,
  phone: String,
  email: String,
  term_status: { type: String, enum: ["active", "vacant", "suspended"], default: "active" },
  source_url: String,
  last_verified_at: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now }
});

schema.index({ role: 1, constituency_name: 1 });
schema.index({ role: 1, ward_no: 1 });

module.exports = mongoose.model("elected_representatives", schema, "elected_representatives");
