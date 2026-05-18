const express = require("express");
const router = express.Router();
const MlaMaster = require("../models/MlaMaster");

// Get all MLAs
router.get("/", async (req, res) => {
  try {
    const mlas = await MlaMaster.find().sort({ constituency_number: 1 });
    res.json(mlas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search MLAs
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const mlas = await MlaMaster.find({
      $or: [
        { name: new RegExp(q, "i") },
        { constituency: new RegExp(q, "i") },
        { district: new RegExp(q, "i") }
      ]
    });
    res.json(mlas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get MLA by specific ID
router.get("/id/:id", async (req, res) => {
  try {
    const mla = await MlaMaster.findById(req.params.id);
    if (!mla) return res.status(404).json({ error: "MLA not found" });
    res.json(mla);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get MLA by constituency name
router.get("/:constituency", async (req, res) => {
  try {
    const mla = await MlaMaster.findOne({ constituency: new RegExp(`^${req.params.constituency}$`, "i") });
    if (!mla) return res.status(404).json({ error: "MLA not found for this constituency" });
    res.json(mla);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
