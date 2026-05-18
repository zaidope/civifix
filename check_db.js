const mongoose = require('mongoose');
const Complaint = require('./Backend/models/Complaint');
require('dotenv').config({ path: './Backend/.env' });

async function check() {
  try {
    console.log("Connecting to DB...");
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected to MongoDB!");
    const complaints = await Complaint.find().sort({ date: -1 }).limit(10);
    complaints.forEach(c => {
      console.log(`ID: ${c._id} | Loc: "${c.location}" | WardName: "${c.resolved_ward_name}"`);
    });
    await mongoose.disconnect();
  } catch (err) {
    console.error("DB Error:", err);
  }
}
check();
