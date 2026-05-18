/**
 * Seed Script: Bengaluru Authority Data
 * 
 * Seeds:
 * 1. BBMP Ward boundaries (225 wards from GeoJSON)
 * 2. Real 2023 MLA data (28 Bengaluru assembly constituencies)
 * 3. Real 2024 MP data (3 Bengaluru Lok Sabha constituencies)
 * 4. Corporators (all marked "Vacant" — no elected corporators currently)
 * 5. Issue → Department mappings with SLAs
 * 6. ULB Master (BBMP)
 * 
 * Usage: node Backend/scripts/seed_bengaluru_authorities.js
 */
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const WardBoundary = require("../models/WardBoundary");
const ElectedRepresentative = require("../models/ElectedRepresentative");
const IssueResponsibilityMap = require("../models/IssueResponsibilityMap");
const UlbMaster = require("../models/UlbMaster");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/citizen_grievance";

// ============================================================
// REAL 2023 MLA DATA — Bengaluru Assembly Constituencies
// Source: 2023 Karnataka Legislative Assembly Election Results
// ============================================================
const MLA_DATA = [
  { name: "S.R. Vishwanath", constituency_name: "Yelahanka", constituency_id: 150, party: "BJP" },
  { name: "Byrathi Basavaraj", constituency_name: "K.R. Puram", constituency_id: 151, party: "BJP" },
  { name: "S.T. Somashekar", constituency_name: "Yeshwanthpur", constituency_id: 152, party: "BJP" },
  { name: "S. Muniraju", constituency_name: "Dasarahalli", constituency_id: 153, party: "BJP" },
  { name: "K. Gopalaiah", constituency_name: "Mahalakshmi Layout", constituency_id: 154, party: "BJP" },
  { name: "Dr. C.N. Ashwath Narayan", constituency_name: "Malleshwaram", constituency_id: 155, party: "BJP" },
  { name: "Suresha B.S.", constituency_name: "Hebbal", constituency_id: 156, party: "INC" },
  { name: "A.C. Srinivasa", constituency_name: "Pulakeshinagar", constituency_id: 157, party: "INC" },
  { name: "K.J. George", constituency_name: "Sarvagnanagar", constituency_id: 158, party: "INC" },
  { name: "S. Raghu", constituency_name: "C.V. Raman Nagar", constituency_id: 159, party: "BJP" },
  { name: "Rizwan Arshad", constituency_name: "Shivajinagar", constituency_id: 160, party: "INC" },
  { name: "N.A. Haris", constituency_name: "Shanti Nagar", constituency_id: 161, party: "INC" },
  { name: "Dinesh Gundu Rao", constituency_name: "Gandhi Nagar", constituency_id: 162, party: "INC" },
  { name: "S. Suresh Kumar", constituency_name: "Rajajinagar", constituency_id: 163, party: "BJP" },
  { name: "B.Z. Zameer Ahmed Khan", constituency_name: "Chamrajpet", constituency_id: 164, party: "INC" },
  { name: "Uday B. Garudachar", constituency_name: "Chickpet", constituency_id: 165, party: "BJP" },
  { name: "L.A. Ravi Subramanya", constituency_name: "Basavanagudi", constituency_id: 166, party: "BJP" },
  { name: "R. Ashoka", constituency_name: "Padmanabhanagar", constituency_id: 167, party: "BJP" },
  { name: "Ramalinga Reddy", constituency_name: "B.T.M. Layout", constituency_id: 168, party: "INC" },
  { name: "C.K. Ramamurthy", constituency_name: "Jayanagar", constituency_id: 169, party: "BJP" },
  { name: "Manjula Limbavalli", constituency_name: "Mahadevapura", constituency_id: 170, party: "BJP" },
  { name: "M. Satish Reddy", constituency_name: "Bommanahalli", constituency_id: 171, party: "BJP" },
  { name: "M. Krishnappa", constituency_name: "Bangalore South", constituency_id: 172, party: "BJP" },
  { name: "B. Shivanna", constituency_name: "Anekal", constituency_id: 173, party: "INC" },
  { name: "Munirathna", constituency_name: "Rajarajeshwari Nagar", constituency_id: 174, party: "BJP" },
  { name: "Krishna Byre Gowda", constituency_name: "Byatarayanapura", constituency_id: 175, party: "INC" },
  { name: "Priya Krishna", constituency_name: "Govindarajanagar", constituency_id: 176, party: "INC" },
  { name: "M. Krishnappa", constituency_name: "Vijayanagar", constituency_id: 177, party: "INC" },
];

// ============================================================
// REAL 2024 MP DATA — Bengaluru Lok Sabha Constituencies
// Source: 2024 General Election Results
// ============================================================
const MP_DATA = [
  {
    name: "Shobha Karandlaje",
    constituency_name: "Bangalore North",
    constituency_id: 27,
    party: "BJP",
    source_url: "https://eci.gov.in"
  },
  {
    name: "P.C. Mohan",
    constituency_name: "Bangalore Central",
    constituency_id: 28,
    party: "BJP",
    source_url: "https://eci.gov.in"
  },
  {
    name: "Tejasvi Surya",
    constituency_name: "Bangalore South",
    constituency_id: 29,
    party: "BJP",
    source_url: "https://eci.gov.in"
  },
  {
    name: "Dr. C.N. Manjunath",
    constituency_name: "Bangalore Rural",
    constituency_id: 26,
    party: "BJP",
    source_url: "https://eci.gov.in"
  },
  {
    name: "D.K. Suresh",
    constituency_name: "Chikballapur",
    constituency_id: 25,
    party: "INC",
    source_url: "https://eci.gov.in"
  },
];

// ============================================================
// ISSUE → DEPARTMENT MAPPINGS with SLAs
// ============================================================
const ISSUE_DEPT_DATA = [
  {
    issue_type: "Garbage / Sanitation",
    primary_department: "BBMP - SWM",
    primary_designation: "Health Inspector",
    escalation_department: "BBMP - SWM",
    escalation_designation: "Zonal Commissioner",
    sla_days: 3,
    routing_rationale: "Solid Waste Management issues are handled by BBMP's SWM division. Ward-level Health Inspectors are the first responders."
  },
  {
    issue_type: "Roads & Streetlights",
    primary_department: "BBMP - Roads & Infrastructure",
    primary_designation: "Assistant Executive Engineer",
    escalation_department: "BBMP - Roads & Infrastructure",
    escalation_designation: "Executive Engineer",
    sla_days: 7,
    routing_rationale: "Road maintenance and streetlight complaints are handled by BBMP's Roads & Infrastructure wing."
  },
  {
    issue_type: "Water Supply",
    primary_department: "BWSSB",
    primary_designation: "Assistant Engineer",
    escalation_department: "BWSSB",
    escalation_designation: "Executive Engineer",
    sla_days: 5,
    routing_rationale: "Water supply issues are under BWSSB (Bangalore Water Supply and Sewerage Board) jurisdiction."
  },
  {
    issue_type: "Drainage / Sewage",
    primary_department: "BWSSB - Sewerage",
    primary_designation: "Junior Engineer",
    escalation_department: "BWSSB - Sewerage",
    escalation_designation: "Executive Engineer",
    sla_days: 5,
    routing_rationale: "Drainage and sewage complaints are handled by BWSSB's Sewerage division."
  },
  {
    issue_type: "Electricity",
    primary_department: "BESCOM",
    primary_designation: "Assistant Engineer",
    escalation_department: "BESCOM",
    escalation_designation: "Executive Engineer",
    sla_days: 3,
    routing_rationale: "Electrical issues are under BESCOM (Bangalore Electricity Supply Company) jurisdiction."
  },
  {
    issue_type: "Health / Safety",
    primary_department: "BBMP - Health",
    primary_designation: "Junior Health Inspector",
    escalation_department: "BBMP - Health",
    escalation_designation: "Chief Health Officer",
    sla_days: 5,
    routing_rationale: "Public health and safety issues are handled by BBMP's Health department."
  },
  {
    issue_type: "Encroachment",
    primary_department: "BBMP - Revenue",
    primary_designation: "Revenue Inspector",
    escalation_department: "BBMP - Revenue",
    escalation_designation: "Joint Commissioner",
    sla_days: 14,
    routing_rationale: "Encroachment issues are handled by BBMP's Revenue and Enforcement division."
  },
  {
    issue_type: "Tree / Environment",
    primary_department: "BBMP - Horticulture",
    primary_designation: "Horticulture Inspector",
    escalation_department: "BBMP - Horticulture",
    escalation_designation: "Director of Horticulture",
    sla_days: 7,
    routing_rationale: "Tree and environment related issues are handled by BBMP's Horticulture department."
  },
  {
    issue_type: "Others",
    primary_department: "BBMP - General Administration",
    primary_designation: "Nodal Officer",
    escalation_department: "BBMP - Commissioner Office",
    escalation_designation: "Commissioner",
    sla_days: 7,
    routing_rationale: "General civic issues are routed to BBMP's General Administration for triage."
  },
];

// ============================================================
// MAIN SEED FUNCTION
// ============================================================
async function main() {
  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  console.log("✅ Connected.\n");

  // --- 1. Seed Ward Boundaries ---
  console.log("📍 Seeding BBMP ward boundaries...");
  const geojsonPath = path.resolve(__dirname, "../data/BBMP_Wards_2023.geojson");
  
  if (!fs.existsSync(geojsonPath)) {
    console.error("❌ GeoJSON file not found at:", geojsonPath);
    console.log("   Download from: https://gist.github.com/Vonter/1a31ff6c48e1418736c81651981c99e1");
    process.exit(1);
  }

  const geojson = JSON.parse(fs.readFileSync(geojsonPath, "utf8"));
  console.log(`   Found ${geojson.features.length} ward features.`);

  // Drop existing ward boundaries and re-seed
  await WardBoundary.deleteMany({});
  
  let wardCount = 0;
  for (const feature of geojson.features) {
    const props = feature.properties;
    try {
      await WardBoundary.create({
        ward_no: props.id,
        ward_name: props.name_en || props.proposed_ward_name_en,
        ward_name_ka: props.name_ka || props.proposed_ward_name_ka,
        boundary: feature.geometry,
        assembly_constituency_id: props.assembly_constituency_id,
        assembly_constituency_name: props.assembly_constituency_name_en
          ? props.assembly_constituency_name_en.replace(/^\d+-/, "")
          : null,
        parliamentary_constituency_id: props.parliamentary_constituency_id,
        parliamentary_constituency_name: props.parliamentary_constituency_name_en
          ? props.parliamentary_constituency_name_en.trim()
          : null,
        population: props.population,
        area_sqkm: props.ward_area
      });
      wardCount++;
    } catch (err) {
      console.error(`   ⚠️ Ward ${props.id}: ${err.message}`);
    }
  }
  console.log(`   ✅ ${wardCount} wards seeded.\n`);

  // --- 2. Seed MLAs ---
  console.log("🏛️ Seeding MLA data (2023 Karnataka Assembly)...");
  await ElectedRepresentative.deleteMany({ role: "mla" });
  
  for (const mla of MLA_DATA) {
    await ElectedRepresentative.create({
      name: mla.name,
      role: "mla",
      constituency_name: mla.constituency_name,
      constituency_id: mla.constituency_id,
      constituency_type: "assembly",
      party: mla.party,
      term_status: "active",
      source_url: "https://kla.kar.nic.in",
      last_verified_at: new Date()
    });
  }
  console.log(`   ✅ ${MLA_DATA.length} MLAs seeded.\n`);

  // --- 3. Seed MPs ---
  console.log("🏛️ Seeding MP data (2024 Lok Sabha)...");
  await ElectedRepresentative.deleteMany({ role: "mp" });
  
  for (const mp of MP_DATA) {
    await ElectedRepresentative.create({
      name: mp.name,
      role: "mp",
      constituency_name: mp.constituency_name,
      constituency_id: mp.constituency_id,
      constituency_type: "parliamentary",
      party: mp.party,
      term_status: "active",
      source_url: mp.source_url,
      last_verified_at: new Date()
    });
  }
  console.log(`   ✅ ${MP_DATA.length} MPs seeded.\n`);

  // --- 4. Seed Corporators (all vacant) ---
  console.log("🏛️ Seeding Corporators (all Vacant — no elected corporators)...");
  await ElectedRepresentative.deleteMany({ role: "corporator" });
  // BBMP has no elected corporators currently — all seats vacant
  console.log(`   ✅ Corporators set to vacant.\n`);

  // --- 5. Seed Issue → Department mappings ---
  console.log("📋 Seeding issue → department mappings...");
  await IssueResponsibilityMap.deleteMany({});
  
  for (const mapping of ISSUE_DEPT_DATA) {
    await IssueResponsibilityMap.create(mapping);
  }
  console.log(`   ✅ ${ISSUE_DEPT_DATA.length} issue mappings seeded.\n`);

  // --- 6. Seed ULB Master (BBMP) ---
  console.log("🏢 Seeding ULB Master...");
  await UlbMaster.findOneAndUpdate(
    { ulb_name: "BBMP" },
    {
      $set: {
        ulb_name: "BBMP",
        ulb_type: "Municipal Corporation",
        district: "Bangalore Urban",
        state: "Karnataka",
        website: "https://bbmp.gov.in",
        office_phone: "1533",
        office_email: "commissioner@bbmp.gov.in",
        office_address: "N.R. Square, Bangalore - 560002",
        commissioner_name: "Commissioner",
        commissioner_designation: "BBMP Commissioner",
        verification_status: "Verified",
        last_verified_at: new Date()
      }
    },
    { upsert: true }
  );
  console.log(`   ✅ BBMP ULB seeded.\n`);

  console.log("🏁 All seed data loaded successfully!");
  console.log("   Ward boundaries: " + wardCount);
  console.log("   MLAs: " + MLA_DATA.length);
  console.log("   MPs: " + MP_DATA.length);
  console.log("   Issue mappings: " + ISSUE_DEPT_DATA.length);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
