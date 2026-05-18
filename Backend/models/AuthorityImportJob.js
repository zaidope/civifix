const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  job_id: { type: String, required: true, unique: true },
  uploaded_by: { type: String, required: true },
  file_name: { type: String, required: true },
  status: { type: String, enum: ['pending', 'validating', 'review', 'imported', 'failed'], default: 'pending' },
  total_rows: { type: Number, default: 0 },
  valid_rows: { type: Number, default: 0 },
  invalid_rows: { type: Number, default: 0 },
  city: { type: String },
  state: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

schema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model("authority_import_jobs", schema, "authority_import_jobs");
