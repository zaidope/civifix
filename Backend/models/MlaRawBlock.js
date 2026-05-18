const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  source_id: { type: mongoose.Schema.Types.ObjectId, ref: 'authority_sources' },
  raw_text: String,
  page_number: Number,
  extracted_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("mlas_raw_blocks", schema);
