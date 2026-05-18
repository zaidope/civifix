const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  issue_type: { type: String, required: true }, // e.g. "Water", "Garbage"
  primary_department: String,
  primary_designation: String,
  escalation_department: String,
  escalation_designation: String,
  severity_level: Number,
  sla_days: { type: Number, default: 7 },
  routing_rationale: String // "This issue is routed to Sanitation because..."
});

module.exports = mongoose.model("issue_responsibility_maps", schema);
