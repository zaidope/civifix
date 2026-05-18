const express = require("express");
const app = express();
const port = process.env.PORT || 8000;
require("dotenv").config(); // Load environment variables
const cors = require("cors");
const helmet = require("helmet");
const jwt = require("jsonwebtoken");
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
app.use(helmet({ crossOriginResourcePolicy: false })); // Allow serving images
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
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

// ***** Routes *****
const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const adminRoutes = require("./routes/adminRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

app.use("/", authRoutes);
app.use("/", complaintRoutes);
app.use("/", adminRoutes); // Mounts /admin, /officer
app.use("/", analyticsRoutes); // Mounts /civic-points, /analytics, /zones

// Test route
app.get("/test", (req, res) => {
  res.json({ message: "Server is running!", timestamp: new Date() });
});

// Test uploads directory
app.get("/test-uploads", (req, res) => {
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

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});

