const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  import_job_id: { type: String, required: true },
  row_index: { type: Number, required: true },
  raw_row: { type: Object, required: true }, // The original JSON from Excel
  normalized_row: { type: Object }, // The parsed and validated row
  validation_status: { type: String, enum: ['valid', 'invalid'], default: 'invalid' },
  validation_errors: [{ type: String }],
  created_at: { type: Date, default: Date.now }
});

// Index for fetching rows by job
schema.index({ import_job_id: 1, row_index: 1 });

module.exports = mongoose.model("authority_import_rows", schema, "authority_import_rows");
