const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema({
  username: String,
  uid: String,
  phone: String,
  departmentOfficer: String,
  category: String,
  location: String,
  description: String,
  images: [String], // Array of image file paths
  date: { type: Date, default: Date.now },
  status: { type: String, default: "Submitted" },
  comments: String,
  resolutionRating: String,
  citizenFeedback: String,
  resolutionOfficerName: String,
  resolutionOfficerPhone: String,
  resolutionDate: Date,
  // Geo + priority fields
  latitude: Number,
  longitude: Number,
  severity_level: Number,
  priority_score: Number,
  priority_level: String,
  zone_id: String,
  // Resolved authority snapshot (populated at submission time)
  resolved_area_name: String,
  resolved_ward_no: Number,
  resolved_ward_name: String,
  resolved_zone_name: String,
  resolved_ulb_name: String,
  resolved_department: String,
  resolved_officer_name: String,
  resolved_officer_designation: String,
  resolved_officer_phone: String,
  resolved_mla_name: String,
  resolved_mla_constituency: String,
  resolved_mla_party: String,
  resolved_mp_name: String,
  resolved_mp_constituency: String,
  resolved_mp_party: String,
  resolved_escalation_officer: String,
  resolved_escalation_designation: String,
  resolved_sla_days: Number,
  resolved_corporator_name: String,
  resolved_corporator_status: String,
  // Upvoting
  upvotes: { type: Number, default: 0 },
  upvotedBy: { type: [String], default: [] },
});

module.exports = mongoose.model("complaints", complaintSchema);
