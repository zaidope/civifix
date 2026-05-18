const express = require("express");
const router = express.Router();
const { getCivicPoints, getAnalytics, getZones } = require("../controllers/analyticsController");

router.get("/civic-points/:uid", getCivicPoints);
router.get("/analytics/:uid", getAnalytics);
router.get("/zones", getZones);

module.exports = router;
