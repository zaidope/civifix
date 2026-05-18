const express = require("express");
const router = express.Router();
const { getAllComplaints, getOfficerComplaints } = require("../controllers/adminController");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");

router.get("/admin", authMiddleware, requireRole(["admin"]), getAllComplaints);
router.get("/officer/:name", authMiddleware, requireRole(["admin", "officer"]), getOfficerComplaints);

module.exports = router;
