const Complaint = require("../models/Complaint");

const getAllComplaints = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    
    // Add pagination as suggested in audit
    const complaints = await Complaint.find()
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
      
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

const getOfficerComplaints = async (req, res) => {
  try {
    const { name } = req.params;
    const query = name === "officer"
      ? { departmentOfficer: { $exists: true, $ne: null, $ne: "" } }
      : {
        $or: [
          { departmentOfficer: name },
          // Include generic officer view
          { departmentOfficer: { $exists: true, $ne: null, $ne: "" } }
        ]
      };
      
    const complaints = await Complaint.find(query).sort({ date: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

module.exports = {
  getAllComplaints,
  getOfficerComplaints
};
