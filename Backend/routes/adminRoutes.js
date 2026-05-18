const express = require("express");
const router = express.Router();
const { getAllComplaints, getOfficerComplaints } = require("../controllers/adminController");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");

router.get("/admin", getAllComplaints);
router.get("/officer/:name", getOfficerComplaints);

module.exports = router;
