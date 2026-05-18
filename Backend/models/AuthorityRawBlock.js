const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  source_id: { type: mongoose.Schema.Types.ObjectId, ref: 'authority_sources' },
  raw_content: String,
  raw_html: String,
  extracted_text: String,
  extraction_type: String,
  extraction_status: String,
  extracted_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("authority_raw_blocks", schema);
