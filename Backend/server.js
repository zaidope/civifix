const express = require("express");
const app = express();
const port = 8000;
require("dotenv").config(); // Load environment variables
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const {
  calculate_bbox_severity,
  count_nearby_duplicates,
  check_main_road,
  calculate_priority_score,
} = require("./priorityUtils");
const {
  calculate_distance,
  assign_or_create_zone,
  update_zone_statistics,
  reverseGeocodeAreaName,
  extractAreaName,
} = require("./zonesUtils");
const { resolveFromCoordinates } = require("./services/authorityResolver");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "*",
  })
);

// ***** Register Routes *****
const authorityRoutes = require("./routes/authorityRoutes");
const mlaRoutes = require("./routes/mlaRoutes");
const ulbRoutes = require("./routes/ulbRoutes");
app.use("/api/authorities", authorityRoutes);
app.use("/api/mlas", mlaRoutes);
app.use("/api/ulbs", ulbRoutes);

// Serve static files from uploads directory
// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// ***** MongoDB Connection *****
// ***** Admin Authority Import *****
const authorityImportRoutes = require("./routes/authorityImportRoutes");
app.use('/api/admin', authorityImportRoutes);
const governanceRoutes = require("./routes/governanceRoutes");
app.use('/api/governance', governanceRoutes);

const mongoURL = process.env.MONGO_URI || "mongodb://localhost:27017/citizen_grievance";

mongoose
  .connect(mongoURL, { serverSelectionTimeoutMS: 5000 })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    console.log("💡 Please check your MongoDB setup or IP whitelist");
  });

// ***** Import Models *****
const User = require("./models/User");
const Complaint = require("./models/Complaint");
const Zone = require("./models/Zone");
const AuthoritySource = require("./models/AuthoritySource");
const AuthorityRawBlock = require("./models/AuthorityRawBlock");
const AuthorityIngestionLog = require("./models/AuthorityIngestionLog");
const MlaRawBlock = require("./models/MlaRawBlock");
const MlaParsedStage = require("./models/MlaParsedStage");
const MlaMaster = require("./models/MlaMaster");
const UlbMaster = require("./models/UlbMaster");
const UlbOfficial = require("./models/UlbOfficial");
const IssueResponsibilityMap = require("./models/IssueResponsibilityMap");

// ***** Register User *****
app.post("/register", async (req, res) => {
  try {
    const { role, name, username, email, pass, uid } = req.body;
    const existing = await User.findOne({
      $or: [{ email }, { username }, { uid }],
    });
    if (existing) return res.status(400).json({ msg: "User already exists" });

    await User.create({ role, name, username, email, password: pass, uid });
    res.status(201).json({ msg: "User registered successfully" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ***** Login *****
app.post("/login", async (req, res) => {
  try {
    const { uname, pass } = req.body;
    console.log("🔐 Login attempt:", { uname, pass });

    if (uname === "admin" && pass === "admin@1234") return res.sendStatus(201);
    if (uname === "officer" && pass === "officer@1234") return res.sendStatus(202);

    console.log("🔍 Searching for user:", uname);
    const user = await User.findOne({ username: uname });
    console.log("👤 User found:", user ? "Yes" : "No");

    if (!user) {
      console.log("❌ User not found");
      return res.status(400).json({ msg: "User not found" });
    }

    if (user.password !== pass) {
      console.log("❌ Invalid password");
      return res.status(400).json({ msg: "Invalid password" });
    }

    console.log("✅ Login successful for:", uname);
    res.status(200).json({ uid: user.uid, role: user.role });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Server error", error: err.message, stack: err.stack });
  }
});

// ***** File Complaint (with images) *****
app.post("/complaints", upload.array('images', 3), async (req, res) => {
  try {
    // Debug: Log everything received
    console.log("📥 Full req.body:", req.body);
    console.log("📥 req.files:", req.files);
    console.log("📥 Content-Type:", req.get('Content-Type'));

    const { username, uid, phone, departmentOfficer, category, location, description } = req.body;

    // Debug: Log received data
    console.log("📥 Parsed complaint data:", {
      username,
      uid,
      phone,
      departmentOfficer,
      category,
      location,
      description
    });
    console.log("📥 Files received:", req.files ? req.files.length : 0);

    // Get uploaded file paths
    const imagePaths = req.files ? req.files.map(file => file.filename) : [];

    console.log("📥 Image paths to save:", imagePaths);
    console.log("📥 Number of images:", imagePaths.length);

    // Parse optional geo coordinates from body
    const latitude = req.body.latitude ? parseFloat(req.body.latitude) : undefined;
    const longitude = req.body.longitude ? parseFloat(req.body.longitude) : undefined;

    // Validate required fields
    if (!username || !uid || !phone || !category || !location || !description) {
      console.error("❌ Missing required fields:", { username, uid, phone, category, location, description });
      return res.status(400).json({ msg: "Missing required fields" });
    }

    // Duplicate complaints check (Fast now due to bounding box optimization)
    const { duplicateCount, duplicatePriority } = await count_nearby_duplicates(Complaint, {
      category,
      latitude,
      longitude,
    });

    // Zone assignment (Fast now due to bounding box optimization)
    let zoneId = null;
    if (typeof latitude === "number" && typeof longitude === "number") {
      zoneId = await assign_or_create_zone(Zone, latitude, longitude);
    }

    // Auto-resolve accountability chain from GPS coordinates (Fast DB lookups)
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
        console.log("✅ Authority chain resolved:", authoritySnapshot.resolved_ward_name);
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
      departmentOfficer,
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

    console.log("✅ Complaint created initially:", complaint._id);

    // Respond IMMEDIATELY to frontend
    res.status(201).json({
      msg: "Complaint submitted successfully",
      complaint,
      images: imagePaths,
      prediction: null, // Will update in background
      severity_level: initialSeverity,
      priority_score: initialScore,
      priority_level: initialLevel,
      duplicate_count: duplicateCount,
      is_main_road: false,
      zone_id: zoneId,
    });

    // --- BACKGROUND PROCESSING FIRE & FORGET ---
    (async () => {
      try {
        console.log(`[Background Task] Starting heavy processing for complaint ${complaint._id}`);
        
        // 1. AI Inference (Slow)
        let baseSeverity = 1;
        let prediction = null;
        if (imagePaths.length > 0) {
          const imagePath = path.join(uploadsDir, imagePaths[0]);
          if (fs.existsSync(imagePath)) {
            const form = new FormData();
            form.append("file", fs.createReadStream(imagePath));
            try {
              const resp = await axios.post("http://127.0.0.1:9000/predict", form, {
                headers: form.getHeaders(),
                timeout: 15000,
              });
              prediction = resp.data;
              if (prediction && prediction.bbox && typeof prediction.image_width === "number") {
                baseSeverity = calculate_bbox_severity({
                  bbox: {
                    x1: prediction.bbox.x1, y1: prediction.bbox.y1,
                    x2: prediction.bbox.x2, y2: prediction.bbox.y2,
                  },
                  imageWidth: prediction.image_width,
                  imageHeight: prediction.image_height,
                });
              }
            } catch (err) {
              console.error(`[Background] AI inference failed for ${complaint._id}`);
            }
          }
        }

        // 2. OSM Main Road Check (Slow)
        const { isMainRoad, roadPriority } = await check_main_road(latitude, longitude);

        // 3. Recalculate Priority
        const { priorityScore, priorityLevel } = calculate_priority_score({
          baseSeverity,
          duplicatePriority,
          roadPriority,
        });

        // 4. Update Database
        await Complaint.findByIdAndUpdate(complaint._id, {
          severity_level: baseSeverity,
          priority_score: priorityScore,
          priority_level: priorityLevel
        });

        // 5. Update Zone Statistics
        if (zoneId) {
          await update_zone_statistics(Zone, zoneId, priorityLevel);
        }

        console.log(`[Background Task] Completed processing for complaint ${complaint._id}. Priority: ${priorityLevel}`);
      } catch (bgErr) {
        console.error(`[Background Task] Fatal error for complaint ${complaint._id}:`, bgErr.message);
      }
    })();
  } catch (err) {
    console.error("Complaint error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

// ***** Update Complaint (Admin/Officer) *****
app.put("/complaints/:id", async (req, res) => {
  try {
    const { status, comments, resolutionOfficerName, resolutionOfficerPhone, resolutionDate, departmentOfficer } = req.body;
    const { id } = req.params;

    // Get old complaint to check if status changed
    const oldComplaint = await Complaint.findById(id);
    if (!oldComplaint) return res.status(404).json({ msg: "Complaint not found" });

    const updated = await Complaint.findByIdAndUpdate(
      id,
      { status, comments, resolutionOfficerName, resolutionOfficerPhone, resolutionDate, departmentOfficer },
      { new: true }
    );

    // Send push notification if status changed
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
          console.log("📲 Push notification sent to", owner.pushToken);
        }
      } catch (pushErr) {
        console.log("Push notification error (non-fatal):", pushErr.message);
      }
    }

    res.json({ msg: "Complaint updated successfully", updated });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ***** Citizen Feedback *****
app.put("/feedback/:id", async (req, res) => {
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
    console.error("Feedback error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ***** Admin View All Complaints *****
app.get("/admin", async (req, res) => {
  try {
    const complaints = await Complaint.find();
    res.json(complaints);
  } catch (err) {
    console.error("Admin view error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ***** Officer View Assigned Complaints *****
// Returns all complaints that have been forwarded to any department
// (since there is a single officer login that handles all forwarded complaints)
app.get("/officer/:name", async (req, res) => {
  try {
    const { name } = req.params;
    // Fetch complaints assigned to this specific department, OR if name='officer',
    // fetch all complaints that have been forwarded to any department
    const query = name === "officer"
      ? { departmentOfficer: { $exists: true, $ne: null, $ne: "" } }
      : {
        $or: [
          { departmentOfficer: name },
          // Also include for the generic 'officer' user all forwarded complaints
          { departmentOfficer: { $exists: true, $ne: null, $ne: "" } }
        ]
      };
    const complaints = await Complaint.find(query);
    res.json(complaints);
  } catch (err) {
    console.error("Officer view error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ***** Citizen Complaint History *****
app.get("/history/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const complaints = await Complaint.find({ uid });
    res.json(complaints);
  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ***** Public Track Status Timeline *****
app.get("/public-complaints", async (req, res) => {
  try {
    const complaints = await Complaint.find();
    res.json(complaints);
  } catch (err) {
    console.error("Public complaints error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ***** Zones API for hotspot map *****
app.get("/api/zones", async (req, res) => {
  try {
    const zones = await Zone.find({}, "-_id -__v").lean();

    // Auto-resolve display_name for any zone still showing "Unknown Area"
    const toFix = zones.filter(
      (z) =>
        (!z.display_name || z.display_name === "Unknown Area") &&
        typeof z.center_lat === "number" &&
        typeof z.center_lon === "number"
    );

    for (const z of toFix) {
      try {
        const name = await reverseGeocodeAreaName(z.center_lat, z.center_lon);
        if (name) {
          z.display_name = name;
          // Persist so we don't re-fetch next time
          Zone.updateOne(
            { zone_id: z.zone_id },
            { $set: { display_name: name } }
          ).exec();
        }
      } catch (_) {
        // Non-fatal — keep "Unknown Area" for this request
      }
    }

    res.json(zones);
  } catch (err) {
    console.error("Zones API error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});


// ***** Delete Complaint (Admin Only) *****
app.delete("/complaints/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Complaint.findByIdAndDelete(id);
    res.json({ msg: "Complaint deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ***** Remove User *****
app.delete("/removeUser/:username", async (req, res) => {
  try {
    const { username } = req.params;
    await User.deleteOne({ username });
    res.json({ msg: "User removed successfully" });
  } catch (err) {
    console.error("Remove user error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ***** Upvote Complaint *****
app.post("/complaints/:id/upvote", async (req, res) => {
  try {
    const { id } = req.params;
    const { uid } = req.body;
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
    console.error("Upvote error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ***** Civic Points *****
app.get("/civic-points/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const complaints = await Complaint.find({ uid });
    const totalComplaints = complaints.length;
    const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;
    const totalPoints = (totalComplaints * 10) + (resolvedCount * 25);

    let badge = 'Newcomer';
    if (totalPoints >= 500) badge = 'Platinum Citizen';
    else if (totalPoints >= 250) badge = 'Gold Citizen';
    else if (totalPoints >= 100) badge = 'Silver Citizen';
    else if (totalPoints >= 30) badge = 'Bronze Citizen';

    res.json({ totalPoints, totalComplaints, resolvedCount, badge });
  } catch (err) {
    console.error("Civic points error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ***** Analytics *****
app.get("/analytics/:uid", async (req, res) => {
  try {
    const { uid } = req.params;
    const complaints = await Complaint.find({ uid });
    const totalComplaints = complaints.length;
    const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;
    const pendingCount = complaints.filter(c => c.status === 'Submitted').length;
    const inProgressCount = complaints.filter(c => c.status === 'Under Progress' || c.status === 'In Progress').length;

    // Category breakdown
    const categoryBreakdown = {};
    complaints.forEach(c => {
      categoryBreakdown[c.category] = (categoryBreakdown[c.category] || 0) + 1;
    });

    // Average resolution time (days)
    const resolvedComplaints = complaints.filter(c => c.status === 'Resolved' && c.resolutionDate);
    let avgResolutionDays = 0;
    if (resolvedComplaints.length > 0) {
      const totalDays = resolvedComplaints.reduce((sum, c) => {
        return sum + ((new Date(c.resolutionDate) - new Date(c.date)) / (1000 * 60 * 60 * 24));
      }, 0);
      avgResolutionDays = Math.round((totalDays / resolvedComplaints.length) * 10) / 10;
    }

    res.json({ totalComplaints, resolvedCount, pendingCount, inProgressCount, categoryBreakdown, avgResolutionDays });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ***** Update Push Token *****
app.post("/update-push-token", async (req, res) => {
  try {
    const { uid, pushToken } = req.body;
    if (!uid || !pushToken) return res.status(400).json({ msg: "Missing uid or pushToken" });
    await User.findOneAndUpdate({ uid }, { pushToken });
    res.json({ msg: "Push token updated" });
  } catch (err) {
    console.error("Push token update error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// Test route
app.get("/test", (req, res) => {
  res.json({ message: "Server is running!", timestamp: new Date() });
});

// Test uploads directory
app.get("/test-uploads", (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const uploadsDir = path.join(__dirname, 'uploads');

  try {
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      res.json({
        message: "Uploads directory exists",
        path: uploadsDir,
        files: files
      });
    } else {
      res.json({
        message: "Uploads directory does not exist",
        path: uploadsDir
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ***** Simple Complaint (fallback without images) *****
app.post("/complaints-simple", async (req, res) => {
  try {
    console.log("📥 Simple complaint data:", req.body);
    console.log("📥 Request headers:", req.headers);

    const { username, uid, phone, departmentOfficer, category, location, description } = req.body;
    const latitude = req.body.latitude ? parseFloat(req.body.latitude) : undefined;
    const longitude = req.body.longitude ? parseFloat(req.body.longitude) : undefined;

    console.log("📥 Parsed fields:", { username, uid, phone, departmentOfficer, category, location, description, latitude, longitude });

    if (!username || !uid || !phone || !category || !location || !description) {
      console.error("❌ Missing fields:", { username, uid, phone, category, location, description });
      return res.status(400).json({ msg: "Missing required fields" });
    }

    // For simple complaints without images, use baseline severity and
    // still factor in duplicates and road type when geo information is present.
    const baseSeverity = 1;
    const { duplicateCount, duplicatePriority } = await count_nearby_duplicates(Complaint, {
      category,
      latitude,
      longitude,
    });

    // Zone assignment (Fast now due to bounding box optimization)
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
        console.log("✅ Authority chain resolved:", authoritySnapshot.resolved_ward_name);
      } catch (authErr) {
        console.error("Authority resolution error (non-fatal):", authErr.message);
      }
    }

    // Initial safe defaults
    const initialRoadPriority = 0;
    const { priorityScore: initialScore, priorityLevel: initialLevel } = calculate_priority_score({
      baseSeverity,
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
      images: [],
      latitude,
      longitude,
      severity_level: baseSeverity,
      priority_score: initialScore,
      priority_level: initialLevel,
      zone_id: zoneId,
      ...authoritySnapshot,
    });

    console.log("✅ Complaint created:", complaint._id);
    res.status(201).json({
      msg: "Complaint submitted successfully",
      complaint,
      severity_level: baseSeverity,
      priority_score: initialScore,
      priority_level: initialLevel,
      duplicate_count: duplicateCount,
      is_main_road: false,
      zone_id: zoneId,
    });

    // --- BACKGROUND PROCESSING FIRE & FORGET ---
    (async () => {
      try {
        console.log(`[Background Task] Starting OSM processing for simple complaint ${complaint._id}`);
        
        // 1. OSM Main Road Check (Slow)
        const { isMainRoad, roadPriority } = await check_main_road(latitude, longitude);

        // 2. Recalculate Priority
        const { priorityScore, priorityLevel } = calculate_priority_score({
          baseSeverity,
          duplicatePriority,
          roadPriority,
        });

        // 3. Update Database
        await Complaint.findByIdAndUpdate(complaint._id, {
          priority_score: priorityScore,
          priority_level: priorityLevel
        });

        // 4. Update Zone Statistics
        if (zoneId) {
          await update_zone_statistics(Zone, zoneId, priorityLevel);
        }

        console.log(`[Background Task] Completed processing for simple complaint ${complaint._id}. Priority: ${priorityLevel}`);
      } catch (bgErr) {
        console.error(`[Background Task] Fatal error for simple complaint ${complaint._id}:`, bgErr.message);
      }
    })();
  } catch (err) {
    console.error("Simple complaint error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

app.listen(port, () => console.log(`🚀 Citizen Grievance server running on port ${port}`));
