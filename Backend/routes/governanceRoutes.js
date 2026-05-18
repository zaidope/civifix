const express = require("express");
const router = express.Router();
const WardBoundary = require("../models/WardBoundary");
const ElectedRepresentative = require("../models/ElectedRepresentative");
const IssueResponsibilityMap = require("../models/IssueResponsibilityMap");

/**
 * GET /api/governance/stats
 * Returns high-level stats for the governance mapping dashboard.
 */
router.get("/stats", async (req, res) => {
  try {
    const [wardCount, electedCount, issueCount] = await Promise.all([
      WardBoundary.countDocuments(),
      ElectedRepresentative.countDocuments(),
      IssueResponsibilityMap.countDocuments()
    ]);

    res.json({
      wardCount,
      electedCount,
      count: issueCount
    });
  } catch (error) {
    console.error("Governance stats error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/governance/issue-mappings
 * Returns all issue-to-department mappings.
 */
router.get("/issue-mappings", async (req, res) => {
  try {
    const mappings = await IssueResponsibilityMap.find().sort({ issue_type: 1 }).lean();
    res.json({ data: mappings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/governance/elected-representatives
 * Returns all elected representatives (MLAs, MPs, Corporators).
 */
router.get("/elected-representatives", async (req, res) => {
  try {
    const reps = await ElectedRepresentative.find().sort({ role: 1, constituency_name: 1 }).lean();
    res.json({ data: reps });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/governance/ward-summary
 * Returns a summary of all wards (excluding heavy geometry).
 */
router.get("/ward-summary", async (req, res) => {
  try {
    const wards = await WardBoundary.find({}, { boundary: 0 })
      .sort({ ward_no: 1 })
      .lean();
    res.json({ data: wards });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
