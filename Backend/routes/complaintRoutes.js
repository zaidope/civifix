const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  submitComplaint,
  updateComplaint,
  submitFeedback,
  upvoteComplaint,
  getPublicComplaints,
  getHistory,
  deleteComplaint
} = require("../controllers/complaintController");

const { authMiddleware, requireRole } = require("../middleware/authMiddleware");

// Configure multer
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

router.post("/complaints", upload.array('images', 3), submitComplaint);
router.post("/complaints-simple", submitComplaint); // Mapped to the same consolidated handler
router.put("/complaints/:id", updateComplaint);
router.put("/complaints/feedback/:id", submitFeedback);
router.post("/complaints/:id/upvote", upvoteComplaint);
router.get("/public-complaints", getPublicComplaints);
router.get("/history/:uid", getHistory);
router.delete("/complaints/:id", deleteComplaint);

module.exports = router;
