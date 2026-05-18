const express = require("express");
const router = express.Router();
const UlbMaster = require("../models/UlbMaster");
const UlbOfficial = require("../models/UlbOfficial");

// Get all ULBs
router.get("/", async (req, res) => {
  try {
    const ulbs = await UlbMaster.find().sort({ district: 1, ulb_name: 1 });
    res.json(ulbs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search ULBs
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const ulbs = await UlbMaster.find({
      $or: [
        { ulb_name: new RegExp(q, "i") },
        { district: new RegExp(q, "i") },
        { ulb_type: new RegExp(q, "i") }
      ]
    });
    res.json(ulbs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get ULB by ID with its officials
router.get("/:id", async (req, res) => {
  try {
    const ulb = await UlbMaster.findById(req.params.id);
    if (!ulb) return res.status(404).json({ error: "ULB not found" });

    const officials = await UlbOfficial.find({ ulb_id: ulb._id });

    res.json({
      ...ulb.toObject(),
      officials,
      departments: [...new Set(officials.map(o => o.department).filter(Boolean))]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get officials for a ULB
router.get("/:id/officials", async (req, res) => {
  try {
    const officials = await UlbOfficial.find({ ulb_id: req.params.id });
    res.json(officials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
