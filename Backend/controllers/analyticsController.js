const Complaint = require("../models/Complaint");
const Zone = require("../models/Zone");
const { reverseGeocodeAreaName } = require("../zonesUtils");

const getCivicPoints = async (req, res) => {
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
    res.status(500).json({ msg: "Server error" });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const { uid } = req.params;
    const complaints = await Complaint.find({ uid });
    const totalComplaints = complaints.length;
    const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;
    const pendingCount = complaints.filter(c => c.status === 'Submitted').length;
    const inProgressCount = complaints.filter(c => c.status === 'Under Progress' || c.status === 'In Progress').length;

    const categoryBreakdown = {};
    complaints.forEach(c => {
      categoryBreakdown[c.category] = (categoryBreakdown[c.category] || 0) + 1;
    });

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
    res.status(500).json({ msg: "Server error" });
  }
};

const getZones = async (req, res) => {
  try {
    const zones = await Zone.find({}, "-_id -__v").lean();

    const toFix = zones.filter(
      (z) =>
        (!z.display_name || z.display_name === "Unknown Area") &&
        typeof z.center_lat === "number" &&
        typeof z.center_lon === "number"
    );

    // BATCH OR CACHE THIS LATER (Phase 2 / 3 task)
    for (const z of toFix) {
      try {
        const name = await reverseGeocodeAreaName(z.center_lat, z.center_lon);
        if (name) {
          z.display_name = name;
          Zone.updateOne(
            { zone_id: z.zone_id },
            { $set: { display_name: name } }
          ).exec();
        }
      } catch (_) {}
    }

    res.json(zones);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

module.exports = {
  getCivicPoints,
  getAnalytics,
  getZones
};
