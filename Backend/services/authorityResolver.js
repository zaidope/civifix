/**
 * Authority Resolver Service — Enhanced with GPS-based polygon resolution.
 * 
 * Architecture:
 * - PRIMARY: Point-in-polygon (polygonResolver) for ward/constituency/reps
 * - SECONDARY: Nominatim (zonesUtils) for human-readable area name display
 * - DB LOOKUP: IssueResponsibilityMap + WardOfficerMap for officer chain
 */
const IssueResponsibilityMap = require("../models/IssueResponsibilityMap");
const UlbOfficial = require("../models/UlbOfficial");
const MlaMaster = require("../models/MlaMaster");
const AreaUlbMap = require("../models/AreaUlbMap");
const AreaMlaMap = require("../models/AreaMlaMap");
const WardOfficerMap = require("../models/WardOfficerMap");
const UlbMaster = require("../models/UlbMaster");
const { resolveCivicGeography } = require("./polygonResolver");
const { reverseGeocodeAreaName } = require("../zonesUtils");
const { getWardDetailsFromExcel, searchWardDetailsByText } = require("./excelResolver");

/**
 * Helper to escape regex special characters
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Resolve issue type → department + officer chain
 */
async function resolveIssueRouting(issueType) {
  let responsibility = null;
  if (issueType) {
    const escapedIssue = escapeRegex(issueType);
    // Try exact match first
    responsibility = await IssueResponsibilityMap.findOne({
      issue_type: new RegExp(`^${escapedIssue}$`, "i")
    }).lean();
    
    // Partial/keyword match fallback
    if (!responsibility) {
      const keywords = issueType.split(/[\s&\/,]+/).filter(k => k.length > 2);
      for (const keyword of keywords) {
        responsibility = await IssueResponsibilityMap.findOne({
          issue_type: new RegExp(escapeRegex(keyword), "i")
        }).lean();
        if (responsibility) break;
      }
    }
  }

  if (!responsibility) {
    responsibility = {
      primary_department: "General Administration",
      primary_designation: "Nodal Officer",
      escalation_department: "Commissioner Office",
      escalation_designation: "Commissioner",
      sla_days: 7,
      routing_rationale: "Default routing applied as specific issue mapping was not found."
    };
  }

  return responsibility;
}

/**
 * Resolve officers for a given ward + department
 */
async function resolveOfficers(wardData, responsibility) {
  let primaryOfficer = null;
  let escalationOfficer = null;

  if (wardData) {
    // Try to find specific ward officer
    primaryOfficer = await WardOfficerMap.findOne({
      ward_name: new RegExp(escapeRegex(wardData.ward_name), "i"),
      department: new RegExp(escapeRegex(responsibility.primary_department), "i")
    }).lean();

    if (!primaryOfficer) {
      // Fallback to ULB official
      primaryOfficer = await UlbOfficial.findOne({
        department: new RegExp(escapeRegex(responsibility.primary_department), "i"),
        designation: new RegExp(escapeRegex(responsibility.primary_designation), "i")
      }).lean();
    }
  }

  if (!primaryOfficer) {
    primaryOfficer = {
      officer_name: "Unassigned",
      designation: responsibility.primary_designation,
      department: responsibility.primary_department,
      phone: "1533",
      email: "contact@bbmp.gov.in"
    };
  }

  // Escalation officer
  if (wardData) {
    escalationOfficer = await UlbOfficial.findOne({
      department: new RegExp(escapeRegex(responsibility.escalation_department), "i"),
      designation: new RegExp(escapeRegex(responsibility.escalation_designation), "i")
    }).lean();
  }

  if (!escalationOfficer) {
    escalationOfficer = {
      officer_name: "Unassigned",
      designation: responsibility.escalation_designation,
      department: responsibility.escalation_department,
      phone: "1533"
    };
  }

  return { primaryOfficer, escalationOfficer };
}

/**
 * GPS-FIRST RESOLVER: Resolve full accountability chain from coordinates.
 * 
 * This is the main entry point when GPS coordinates are available.
 * Uses polygon resolver (authoritative) + Nominatim (display name only).
 * 
 * @param {number} lat
 * @param {number} lng
 * @param {string} issueType
 * @returns {Promise<Object>} Full accountability chain
 */
async function resolveFromCoordinates(lat, lng, issueType) {
  // Step 1: Authoritative civic geography from polygon resolver
  const civic = await resolveCivicGeography(lat, lng);
  
  // Step 2: Human-readable area name from Nominatim (display only!)
  const areaName = await reverseGeocodeAreaName(lat, lng) || "Unknown Area";

  // Step 3: Issue routing
  const responsibility = await resolveIssueRouting(issueType);

  // Step 4: Officer chain
  const { primaryOfficer, escalationOfficer } = await resolveOfficers(
    civic.ward, responsibility
  );

  // Step 4.5: Excel Data Lookup
  let excelData = null;
  if (civic.ward && civic.ward.ward_no) {
    excelData = getWardDetailsFromExcel(civic.ward.ward_no);
  }

  // Step 5: ULB lookup
  let ulb = null;
  if (civic.ward) {
    ulb = await UlbMaster.findOne({
      ulb_name: /BBMP|Bruhat Bengaluru/i
    }).lean();
  }
  if (!ulb) {
    ulb = { ulb_name: "BBMP", ulb_type: "Municipal Corporation" };
  }

  return {
    location_context: {
      area_name: areaName,
      ward_no: civic.ward ? civic.ward.ward_no : null,
      ward_name: civic.ward ? civic.ward.ward_name : null,
      zone_name: civic.ward ? civic.ward.zone_name : null,
      assembly_constituency: civic.ward ? civic.ward.assembly_constituency_name : null,
      parliamentary_constituency: civic.ward ? civic.ward.parliamentary_constituency_name : null,
      pincode: null // Would need reverse geocode
    },
    excel_data: excelData,
    administrative: [
      {
        role: "Department",
        name: responsibility.primary_department,
        designation: responsibility.primary_designation || "Primary Department"
      },
      {
        role: "Primary Officer",
        name: primaryOfficer.officer_name || primaryOfficer.name || "Unassigned",
        designation: primaryOfficer.designation || responsibility.primary_designation,
        department: primaryOfficer.department || responsibility.primary_department,
        phone: primaryOfficer.phone || null,
        email: primaryOfficer.email || null
      },
      {
        role: "Escalation Officer",
        name: escalationOfficer.officer_name || escalationOfficer.name || "Unassigned",
        designation: escalationOfficer.designation || responsibility.escalation_designation,
        department: escalationOfficer.department || responsibility.escalation_department,
        phone: escalationOfficer.phone || null,
        email: escalationOfficer.email || null
      }
    ],
    elected: [
      {
        role: "Corporator",
        name: civic.elected.corporator?.name || "Vacant",
        party: civic.elected.corporator?.party || null,
        status: civic.elected.corporator?.term_status || "vacant",
        ward_no: civic.ward ? civic.ward.ward_no : null
      },
      {
        role: "MLA",
        name: (excelData && excelData.mlaName && excelData.mlaName !== 'Unassigned') ? excelData.mlaName : (civic.elected.mla?.name || "Unassigned"),
        party: civic.elected.mla?.party || null,
        constituency: (excelData && excelData.acName) ? excelData.acName : (civic.elected.mla?.constituency_name || (civic.ward ? civic.ward.assembly_constituency_name : null)),
        phone: civic.elected.mla?.phone || null,
        email: civic.elected.mla?.email || null
      },
      {
        role: "MP",
        name: (excelData && excelData.mpName && excelData.mpName !== 'Unassigned') ? excelData.mpName : (civic.elected.mp?.name || "Unassigned"),
        party: civic.elected.mp?.party || null,
        constituency: (excelData && excelData.pcName) ? excelData.pcName : (civic.elected.mp?.constituency_name || (civic.ward ? civic.ward.parliamentary_constituency_name : null)),
        phone: civic.elected.mp?.phone || null,
        email: civic.elected.mp?.email || null
      }
    ],
    ulb: ulb,
    routing_rationale: responsibility.routing_rationale,
    sla_days: responsibility.sla_days || 7,
    source_trust: {
      method: civic.resolved ? "polygon" : "fallback",
      verified: civic.resolved,
      last_verified_at: new Date()
    }
  };
}

/**
 * TEXT-BASED RESOLVER (legacy): Resolves using area string matching.
 * Used when only a text location is available (no GPS coords).
 */
async function resolveAuthorityChain(issueType, lat, lng, area = null, pincode = null, ward = null) {
  // If we have coordinates, prefer GPS-based resolution
  if (typeof lat === "number" && typeof lng === "number") {
    return resolveFromCoordinates(lat, lng, issueType);
  }

  // --- Legacy text-based resolution ---
  let ulbMap = null;
  const locationQueries = [];
  
  if (area) {
    locationQueries.push({ area_name: new RegExp(escapeRegex(area), "i") });
    const parts = area.split(/,\s*/);
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.length > 2) {
        locationQueries.push({ area_name: new RegExp(escapeRegex(trimmed), "i") });
      }
    }
  }
  if (ward) locationQueries.push({ ward_name: new RegExp(escapeRegex(ward), "i") });
  if (pincode) locationQueries.push({ pincode: pincode });

  if (locationQueries.length > 0) {
    ulbMap = await AreaUlbMap.findOne({ $or: locationQueries }).populate("ulb_id");
  }

  if (!ulbMap) {
    // Assume Bengaluru/BBMP context for text fallbacks if no specific area mapping found
    const bbmp = await UlbMaster.findOne({ ulb_name: /BBMP|Bruhat Bengaluru/i });
    if (bbmp) {
      ulbMap = { ulb_id: bbmp, ward_name: "General", ward_number: null, area_name: area || "Bengaluru", pincode: null };
    }
  }

  const ulb = ulbMap ? ulbMap.ulb_id : null;
  
  // Try Excel fallback
  let excelData = null;
  if (area) excelData = searchWardDetailsByText(area);
  if (!excelData && ward) excelData = searchWardDetailsByText(ward);

  const resolvedWard = ulbMap && ulbMap.ward_name !== "General" ? ulbMap.ward_name : (excelData ? excelData.wardName : (ward || "General Area"));

  // MLA from area mapping
  let mlaMap = null;
  if (locationQueries.length > 0) {
    mlaMap = await AreaMlaMap.findOne({ $or: locationQueries }).populate("mla_id");
  }
  const mla = mlaMap ? mlaMap.mla_id : null;

  // Issue routing
  const responsibility = await resolveIssueRouting(issueType);

  // Officers
  let primaryOfficer = null;
  if (ulb) {
    let searchWard = null;
    if (ulbMap && ulbMap.ward_name !== "General") searchWard = ulbMap.ward_name;
    else if (excelData) searchWard = excelData.wardName;

    if (searchWard) {
      const wardOfficerMap = await WardOfficerMap.findOne({
        ulb_id: ulb._id,
        ward_name: searchWard,
        department: responsibility.primary_department
      }).populate("officer_id");

      if (wardOfficerMap) {
        primaryOfficer = wardOfficerMap.officer_id;
      }
    }
    
    if (!primaryOfficer) {
      primaryOfficer = await UlbOfficial.findOne({
        ulb_id: ulb._id,
        department: responsibility.primary_department,
        designation: responsibility.primary_designation
      });
    }
  }

  if (!primaryOfficer) {
    primaryOfficer = {
      officer_name: "Unassigned",
      designation: responsibility.primary_designation,
      department: responsibility.primary_department,
      phone: ulb ? (ulb.helpline || "1533") : "1533",
      email: ulb ? ulb.email : "contact@bbmp.gov.in"
    };
  }

  let escalationOfficer = null;
  if (ulb) {
    escalationOfficer = await UlbOfficial.findOne({
      ulb_id: ulb._id,
      department: responsibility.escalation_department,
      designation: responsibility.escalation_designation
    });
  }

  if (!escalationOfficer) {
    escalationOfficer = {
      officer_name: "Unassigned",
      designation: responsibility.escalation_designation,
      department: responsibility.escalation_department,
      phone: ulb ? (ulb.helpline || "1533") : "1533"
    };
  }

  return {
    location_context: {
      area_name: area || (ulbMap ? ulbMap.area_name : null),
      ward_name: resolvedWard,
      ward_no: ulbMap ? ulbMap.ward_number : null,
      pincode: pincode || (ulbMap ? ulbMap.pincode : null)
    },
    administrative: [
      {
        role: "Department",
        name: responsibility.primary_department,
        designation: responsibility.primary_designation
      },
      {
        role: "Primary Officer",
        name: primaryOfficer.officer_name || "Unassigned",
        designation: primaryOfficer.designation || responsibility.primary_designation,
        department: primaryOfficer.department || responsibility.primary_department,
        phone: primaryOfficer.phone || null,
        email: primaryOfficer.email || null
      },
      {
        role: "Escalation Officer",
        name: escalationOfficer.officer_name || "Unassigned",
        designation: escalationOfficer.designation || responsibility.escalation_designation,
        department: escalationOfficer.department || responsibility.escalation_department,
        phone: escalationOfficer.phone || null
      }
    ],
    elected: [
      { role: "Corporator", name: "Vacant", status: "vacant", ward_no: excelData ? excelData.wardNo : null },
      {
        role: "MLA",
        name: (excelData && excelData.mlaName && excelData.mlaName !== 'Unassigned') ? excelData.mlaName : (mla ? mla.name : "Unassigned"),
        party: mla ? mla.party : null,
        constituency: (excelData && excelData.acName) ? excelData.acName : (mla ? mla.constituency : null)
      },
      { 
        role: "MP", 
        name: (excelData && excelData.mpName && excelData.mpName !== 'Unassigned') ? excelData.mpName : "Unassigned", 
        party: null, 
        constituency: (excelData && excelData.pcName) ? excelData.pcName : null 
      }
    ],
    ulb: ulb,
    routing_rationale: responsibility.routing_rationale,
    sla_days: responsibility.sla_days || 7,
    source_trust: {
      method: "text_match",
      verified: !!ulbMap && !!excelData,
      last_verified_at: new Date()
    }
  };
}

module.exports = {
  resolveAuthorityChain,
  resolveFromCoordinates
};
