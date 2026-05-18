const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  source_id: { type: mongoose.Schema.Types.ObjectId, ref: 'authority_sources' },
  parsed_data: Object, // The raw parsed JSON representation of the row before normalization
  parse_confidence: Number,
  parsed_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("mlas_parsed_stages", schema);
