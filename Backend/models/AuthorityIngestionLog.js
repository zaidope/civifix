const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  source_id: { type: mongoose.Schema.Types.ObjectId, ref: 'authority_sources' },
  status: String,
  records_found: Number,
  records_updated: Number,
  records_failed: Number,
  error_log: String,
  ingested_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("authority_ingestion_logs", schema);
