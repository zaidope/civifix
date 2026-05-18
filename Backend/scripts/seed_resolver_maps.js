const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const UlbMaster = require("../models/UlbMaster");
const MlaMaster = require("../models/MlaMaster");
const UlbOfficial = require("../models/UlbOfficial");
const AreaUlbMap = require("../models/AreaUlbMap");
const AreaMlaMap = require("../models/AreaMlaMap");
const WardOfficerMap = require("../models/WardOfficerMap");
const IssueResponsibilityMap = require("../models/IssueResponsibilityMap");

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    // Clear existing maps for a clean seed
    await AreaUlbMap.deleteMany({});
    await AreaMlaMap.deleteMany({});
    await WardOfficerMap.deleteMany({});
    await IssueResponsibilityMap.deleteMany({});

    console.log("Cleared existing resolver maps.");

    // Fetch existing ULBs and MLAs
    const bbmp = await UlbMaster.findOne({ ulb_name: /Bruhat Bengaluru Mahanagara Palike/i });
    if (!bbmp) throw new Error("BBMP ULB not found. Run ingest_ulbs.py first.");

    const mahadevapuraMla = await MlaMaster.findOne({ constituency: /Mahadevapura/i }) ||
      await MlaMaster.findOne({ constituency: /C.V. Raman Nagar/i }) ||
      await MlaMaster.findOne(); // Fallback to any if not found for testing

    if (!mahadevapuraMla) throw new Error("No MLAs found. Run ingest_mlas.py first.");

    // 1. Seed AreaUlbMap
    const areas = [
      { area_name: "Bellandur", ward_name: "Bellandur", ward_number: "150", pincode: "560103", ulb_id: bbmp._id, ulb_name: bbmp.ulb_name },
      { area_name: "Whitefield", ward_name: "Hagadur", ward_number: "84", pincode: "560066", ulb_id: bbmp._id, ulb_name: bbmp.ulb_name },
      { area_name: "Koramangala", ward_name: "Koramangala", ward_number: "151", pincode: "560034", ulb_id: bbmp._id, ulb_name: bbmp.ulb_name },
      { area_name: "Indiranagar", ward_name: "Hoysala Nagar", ward_number: "80", pincode: "560038", ulb_id: bbmp._id, ulb_name: bbmp.ulb_name },
      { area_name: "Jayanagar", ward_name: "Jayanagar East", ward_number: "170", pincode: "560011", ulb_id: bbmp._id, ulb_name: bbmp.ulb_name }
    ];
    await AreaUlbMap.insertMany(areas);
    console.log(`Seeded ${areas.length} AreaUlbMap records.`);

    // 2. Seed AreaMlaMap
    const mlaAreas = [
      { area_name: "Bellandur", ward_name: "Bellandur", pincode: "560103", constituency: mahadevapuraMla.constituency, mla_id: mahadevapuraMla._id },
      { area_name: "Whitefield", ward_name: "Hagadur", pincode: "560066", constituency: mahadevapuraMla.constituency, mla_id: mahadevapuraMla._id },
    ];
    await AreaMlaMap.insertMany(mlaAreas);
    console.log(`Seeded ${mlaAreas.length} AreaMlaMap records.`);

    // 3. Seed IssueResponsibilityMap — covers actual complaint categories
    const issues = [
      // Exact matches for real complaint categories
      { issue_type: "Roads & Streetlights", primary_department: "Engineering", primary_designation: "Assistant Engineer", escalation_department: "Engineering", escalation_designation: "Executive Engineer", severity_level: 3, routing_rationale: "Road and streetlight issues are handled by ward-level Assistant Engineers under BBMP Engineering." },
      { issue_type: "Garbage / Sanitation", primary_department: "Health", primary_designation: "Health Inspector", escalation_department: "Commissioner Office", escalation_designation: "Zonal Commissioner", severity_level: 2, routing_rationale: "Solid Waste Management rules assign primary responsibility to Health Inspectors at the ward level." },
      { issue_type: "Road Damage", primary_department: "Engineering", primary_designation: "Assistant Engineer", escalation_department: "Engineering", escalation_designation: "Executive Engineer", severity_level: 3, routing_rationale: "Road damage complaints are routed to ward-level Engineering staff." },
      { issue_type: "Health / Safety", primary_department: "Health", primary_designation: "Medical Officer", escalation_department: "Health", escalation_designation: "Chief Health Officer", severity_level: 4, routing_rationale: "Health and safety concerns are managed by Medical Officers at the ward level." },
      { issue_type: "Noise", primary_department: "Revenue", primary_designation: "Revenue Inspector", escalation_department: "Revenue", escalation_designation: "Tahsildar", severity_level: 1, routing_rationale: "Noise complaints fall under Revenue department jurisdiction per local bylaws." },
      { issue_type: "Water Supply", primary_department: "Water Supply", primary_designation: "Assistant Executive Engineer", escalation_department: "Water Board", escalation_designation: "Chief Engineer", severity_level: 4, routing_rationale: "Water supply falls under the Water Board subdivision for the ward." },
      // Keyword-match fallbacks
      { issue_type: "Garbage", primary_department: "Health", primary_designation: "Health Inspector", escalation_department: "Commissioner Office", escalation_designation: "Zonal Commissioner", severity_level: 2, routing_rationale: "Solid Waste Management rules assign primary responsibility to Health Inspectors at the ward level." },
      { issue_type: "Pothole", primary_department: "Engineering", primary_designation: "Assistant Engineer", escalation_department: "Engineering", escalation_designation: "Executive Engineer", severity_level: 3, routing_rationale: "Road maintenance is handled by ward-level Assistant Engineers." },
      { issue_type: "Streetlight", primary_department: "Electrical", primary_designation: "Assistant Executive Engineer (Elec)", escalation_department: "Electrical", escalation_designation: "Executive Engineer (Elec)", severity_level: 2, routing_rationale: "Street lighting is managed by the Electrical subdivision." },
      { issue_type: "Other", primary_department: "General Administration", primary_designation: "Nodal Officer", escalation_department: "Commissioner Office", escalation_designation: "Commissioner", severity_level: 1, routing_rationale: "General complaints are routed to the Nodal Officer under General Administration." },
      { issue_type: "Others", primary_department: "General Administration", primary_designation: "Nodal Officer", escalation_department: "Commissioner Office", escalation_designation: "Commissioner", severity_level: 1, routing_rationale: "General complaints are routed to the Nodal Officer under General Administration." },
    ];
    await IssueResponsibilityMap.insertMany(issues);
    console.log(`Seeded ${issues.length} IssueResponsibilityMap records.`);

    // 4. Seed WardOfficerMap
    // First, find some officials for the departments
    const healthOfficial = await UlbOfficial.findOne({ ulb_id: bbmp._id, department: "Health" });
    const engineeringOfficial = await UlbOfficial.findOne({ ulb_id: bbmp._id, department: "Engineering" });

    if (healthOfficial && engineeringOfficial) {
      const wardOfficers = [
        { ulb_id: bbmp._id, ward_name: "Bellandur", ward_number: "150", department: "Health", officer_id: healthOfficial._id },
        { ulb_id: bbmp._id, ward_name: "Bellandur", ward_number: "150", department: "Engineering", officer_id: engineeringOfficial._id }
      ];
      await WardOfficerMap.insertMany(wardOfficers);
      console.log(`Seeded ${wardOfficers.length} WardOfficerMap records.`);
    } else {
      console.log("Could not find Health or Engineering officials for BBMP. Skipping WardOfficerMap seed.");
    }

    console.log("Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
}

seed();
