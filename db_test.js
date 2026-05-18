const mongoose = require('mongoose');
const IssueResponsibilityMap = require('./Backend/models/IssueResponsibilityMap');
const WardOfficerMap = require('./Backend/models/WardOfficerMap');
const UlbOfficial = require('./Backend/models/UlbOfficial');
const MlaMaster = require('./Backend/models/MlaMaster');
const Complaint = require('./Backend/models/Complaint');

require('dotenv').config({ path: './Backend/.env' });

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const ulbOfficers = await UlbOfficial.find({});
  console.log("ULB Officials:", ulbOfficers.length);
  if (ulbOfficers.length > 0) console.log(ulbOfficers[0]);

  const wardOfficers = await WardOfficerMap.find({});
  console.log("Ward Officers:", wardOfficers.length);

  const mlas = await MlaMaster.find({});
  console.log("MLAs:", mlas.length);

  const complaints = await Complaint.find({ resolved_ward_name: { $exists: true } }).limit(1);
  console.log("Sample Complaint with resolved data:", complaints);

  mongoose.disconnect();
}

check().catch(console.error);
