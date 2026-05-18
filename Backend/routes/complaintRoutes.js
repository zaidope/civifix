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

router.post("/", authMiddleware, upload.array('images', 3), submitComplaint);
router.post("/simple", authMiddleware, submitComplaint); // Mapped to the same consolidated handler
router.put("/:id", authMiddleware, requireRole(["officer", "admin"]), updateComplaint);
router.put("/feedback/:id", authMiddleware, submitFeedback);
router.post("/:id/upvote", authMiddleware, upvoteComplaint);
router.get("/public", getPublicComplaints);
router.get("/history/:uid", authMiddleware, getHistory);
router.delete("/:id", authMiddleware, requireRole(["admin"]), deleteComplaint);

module.exports = router;
