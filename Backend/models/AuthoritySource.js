const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  source_url: { type: String, required: true },
  source_domain: String,
  source_type: String, // e.g. "PDF", "HTML"
  authority_scope: String, // e.g. "MLA", "ULB"
  district: String,
  ulb_name: String,
  department: String,
  content_format: String,
  last_seen: { type: Date, default: Date.now },
  crawl_status: String,
  trust_score: Number,
  is_active: { type: Boolean, default: true },
  source_snapshot_hash: String, // Hashed content to detect changes
});

module.exports = mongoose.model("authority_sources", schema, "authority_sources");
