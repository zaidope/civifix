const express = require("express");
const router = express.Router();
const { resolveAuthorityChain, resolveFromCoordinates } = require("../services/authorityResolver");
const Complaint = require("../models/Complaint");

/**
 * GET /api/authorities/resolve
 * Resolves accountability chain from coordinates or text.
 * GPS-first when lat/lng provided, text fallback otherwise.
 */
router.get("/resolve", async (req, res) => {
  try {
    const { lat, lng, issue, ward, area, pincode } = req.query;
    if (!issue) {
      return res.status(400).json({ error: "issue parameter is required" });
    }

    // GPS-first resolution
    if (lat && lng) {
      const chain = await resolveFromCoordinates(
        parseFloat(lat),
        parseFloat(lng),
        issue
      );
      return res.json(chain);
    }

    // Text-based fallback
    const chain = await resolveAuthorityChain(
      issue,
      null,
      null,
      area,
      pincode,
      ward
    );
    res.json(chain);
  } catch (error) {
    console.error("Authority resolve error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/authorities/accountability-chain/:complaintId
 * Returns the accountability chain for a specific complaint.
 * Uses stored snapshot data if available, otherwise resolves live.
 */
router.get("/accountability-chain/:complaintId", async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.complaintId).lean();
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    // If complaint has stored authority snapshot, return it
    if (complaint.resolved_ward_name) {
      return res.json({
        location_context: {
          area_name: complaint.resolved_area_name,
          ward_no: complaint.resolved_ward_no,
          ward_name: complaint.resolved_ward_name,
          zone_name: complaint.resolved_zone_name
        },
        administrative: [
          {
            role: "Department",
            name: complaint.resolved_department || "General Administration",
            designation: complaint.resolved_officer_designation || "Primary"
          },
          {
            role: "Primary Officer",
            name: complaint.resolved_officer_name || "Unassigned",
            designation: complaint.resolved_officer_designation || "Officer",
            phone: complaint.resolved_officer_phone || null
          },
          {
            role: "Escalation Officer",
            name: complaint.resolved_escalation_officer || "Unassigned",
            designation: complaint.resolved_escalation_designation || "Commissioner"
          }
        ],
        elected: [
          {
            role: "Corporator",
            name: complaint.resolved_corporator_name || "Vacant",
            status: complaint.resolved_corporator_status || "vacant"
          },
          {
            role: "MLA",
            name: complaint.resolved_mla_name || "Unassigned",
            party: complaint.resolved_mla_party || null,
            constituency: complaint.resolved_mla_constituency || null
          },
          {
            role: "MP",
            name: complaint.resolved_mp_name || "Unassigned",
            party: complaint.resolved_mp_party || null,
            constituency: complaint.resolved_mp_constituency || null
          }
        ],
        ulb: { ulb_name: complaint.resolved_ulb_name || "BBMP" },
        sla_days: complaint.resolved_sla_days || 7,
        source_trust: { method: "snapshot", verified: true }
      });
    }

    // No snapshot — resolve live from coordinates
    if (typeof complaint.latitude === "number" && typeof complaint.longitude === "number") {
      const chain = await resolveFromCoordinates(
        complaint.latitude,
        complaint.longitude,
        complaint.category
      );
      return res.json(chain);
    }

    // Last resort: text-based resolution
    const chain = await resolveAuthorityChain(
      complaint.category,
      null, null,
      complaint.location,
      null, null
    );
    res.json(chain);
  } catch (error) {
    console.error("Accountability chain error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
