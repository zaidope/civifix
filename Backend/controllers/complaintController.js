const path = require("path");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const {
  calculate_bbox_severity,
  count_nearby_duplicates,
  check_main_road,
  calculate_priority_score,
} = require("../priorityUtils");
const {
  assign_or_create_zone,
  update_zone_statistics,
} = require("../zonesUtils");
const { resolveFromCoordinates } = require("../services/authorityResolver");
const Complaint = require("../models/Complaint");
const Zone = require("../models/Zone");
const User = require("../models/User");
const { complaintQueue } = require("../workers/complaintQueue");

const uploadsDir = path.join(__dirname, '../uploads');

const submitComplaint = async (req, res) => {
  try {
    const { username, uid, phone, departmentOfficer, category, location, description } = req.body;
    
    // Parse optional geo coordinates from body
    const latitude = req.body.latitude ? parseFloat(req.body.latitude) : undefined;
    const longitude = req.body.longitude ? parseFloat(req.body.longitude) : undefined;

    // Get uploaded file paths
    const imagePaths = req.files ? req.files.map(file => file.filename) : [];

    // Validate required fields
    if (!username || !uid || !phone || !category || !location || !description) {
      return res.status(400).json({ msg: "Missing required fields" });
    }

    // Duplicate complaints check (Fast now due to bounding box optimization)
    const { duplicateCount, duplicatePriority } = await count_nearby_duplicates(Complaint, {
      category,
      latitude,
      longitude,
    });

    // Zone assignment
    let zoneId = null;
    if (typeof latitude === "number" && typeof longitude === "number") {
      zoneId = await assign_or_create_zone(Zone, latitude, longitude);
    }

    // Auto-resolve accountability chain from GPS coordinates
    let authoritySnapshot = {};
    if (typeof latitude === "number" && typeof longitude === "number") {
      try {
        const chain = await resolveFromCoordinates(latitude, longitude, category);
        authoritySnapshot = {
          resolved_area_name: chain.location_context?.area_name,
          resolved_ward_no: chain.location_context?.ward_no,
          resolved_ward_name: chain.location_context?.ward_name,
          resolved_zone_name: chain.location_context?.zone_name,
          resolved_ulb_name: chain.ulb?.ulb_name,
          resolved_department: chain.administrative?.[0]?.name,
          resolved_officer_name: chain.administrative?.[1]?.name,
          resolved_officer_designation: chain.administrative?.[1]?.designation,
          resolved_officer_phone: chain.administrative?.[1]?.phone,
          resolved_escalation_officer: chain.administrative?.[2]?.name,
          resolved_escalation_designation: chain.administrative?.[2]?.designation,
          resolved_mla_name: chain.elected?.[1]?.name,
          resolved_mla_constituency: chain.elected?.[1]?.constituency,
          resolved_mla_party: chain.elected?.[1]?.party,
          resolved_mp_name: chain.elected?.[2]?.name,
          resolved_mp_constituency: chain.elected?.[2]?.constituency,
          resolved_mp_party: chain.elected?.[2]?.party,
          resolved_corporator_name: chain.elected?.[0]?.name,
          resolved_corporator_status: chain.elected?.[0]?.status,
          resolved_sla_days: chain.sla_days,
        };
      } catch (authErr) {
        console.error("Authority resolution error (non-fatal):", authErr.message);
      }
    }

    // Initial safe defaults
    const initialSeverity = 1;
    const initialRoadPriority = 0;
    const { priorityScore: initialScore, priorityLevel: initialLevel } = calculate_priority_score({
      baseSeverity: initialSeverity,
      duplicatePriority,
      roadPriority: initialRoadPriority,
    });

    const complaint = await Complaint.create({
      username,
      uid,
      phone,
      departmentOfficer: departmentOfficer || 'officer',
      category,
      location,
      description,
      images: imagePaths,
      latitude,
      longitude,
      severity_level: initialSeverity,
      priority_score: initialScore,
      priority_level: initialLevel,
      zone_id: zoneId,
      ...authoritySnapshot,
    });

    // Respond IMMEDIATELY to frontend
    res.status(201).json({
      msg: "Complaint submitted successfully",
      complaint,
      images: imagePaths,
      severity_level: initialSeverity,
      priority_score: initialScore,
      priority_level: initialLevel,
      duplicate_count: duplicateCount,
      zone_id: zoneId,
    });

    // --- BACKGROUND PROCESSING FIRE & FORGET (via BullMQ) ---
    await complaintQueue.add("processComplaint", {
      complaintId: complaint._id,
      imagePaths,
      latitude,
      longitude,
      zoneId,
      duplicatePriority
    });
  } catch (err) {
    console.error("Complaint error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

const updateComplaint = async (req, res) => {
  try {
    const { status, comments, resolutionOfficerName, resolutionOfficerPhone, resolutionDate, departmentOfficer } = req.body;
    const { id } = req.params;

    const oldComplaint = await Complaint.findById(id);
    if (!oldComplaint) return res.status(404).json({ msg: "Complaint not found" });

    const updated = await Complaint.findByIdAndUpdate(
      id,
      { status, comments, resolutionOfficerName, resolutionOfficerPhone, resolutionDate, departmentOfficer },
      { new: true }
    );

    if (status && status !== oldComplaint.status && updated.uid) {
      try {
        const owner = await User.findOne({ uid: updated.uid });
        if (owner && owner.pushToken) {
          const message = {
            to: owner.pushToken,
            sound: 'default',
            title: `Complaint ${status}`,
            body: `Your "${updated.category}" complaint has been updated to: ${status}`,
            data: { complaintId: updated._id.toString() },
          };
          await axios.post('https://exp.host/--/api/v2/push/send', message, {
            headers: { 'Content-Type': 'application/json' },
          });
        }
      } catch (pushErr) {
        // Non-fatal
      }
    }

    res.json({ msg: "Complaint updated successfully", updated });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

const submitFeedback = async (req, res) => {
  try {
    const { resolutionRating, citizenFeedback } = req.body;
    const { id } = req.params;

    const updated = await Complaint.findByIdAndUpdate(
      id,
      { resolutionRating, citizenFeedback },
      { new: true }
    );

    if (!updated) return res.status(404).json({ msg: "Complaint not found" });
    res.json({ msg: "Feedback submitted successfully", updated });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

const upvoteComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { uid } = req.body; // In a fully secure app, take uid from req.user
    if (!uid) return res.status(400).json({ msg: "Missing uid" });

    const complaint = await Complaint.findById(id);
    if (!complaint) return res.status(404).json({ msg: "Complaint not found" });

    if (complaint.upvotedBy && complaint.upvotedBy.includes(uid)) {
      return res.status(400).json({ msg: "Already upvoted" });
    }

    complaint.upvotes = (complaint.upvotes || 0) + 1;
    complaint.upvotedBy = [...(complaint.upvotedBy || []), uid];
    await complaint.save();

    res.json({ msg: "Upvoted", upvotes: complaint.upvotes });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

const getPublicComplaints = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const complaints = await Complaint.find()
      .select("-upvotedBy") // Don't send array of uids
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
      
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

const getHistory = async (req, res) => {
  try {
    const { uid } = req.params;
    // ensure uid belongs to req.user here later for security
    const complaints = await Complaint.find({ uid }).sort({ date: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

const deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    await Complaint.findByIdAndDelete(id);
    res.json({ msg: "Complaint deleted successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

module.exports = {
  submitComplaint,
  updateComplaint,
  submitFeedback,
  upvoteComplaint,
  getPublicComplaints,
  getHistory,
  deleteComplaint
};
