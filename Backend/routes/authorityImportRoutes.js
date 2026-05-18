const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');

// Import models
const AuthorityImportJob = require('../models/AuthorityImportJob');
const AuthorityImportRow = require('../models/AuthorityImportRow');
const UlbMaster = require('../models/UlbMaster');
const MlaMaster = require('../models/MlaMaster');
const AreaUlbMap = require('../models/AreaUlbMap');
const AreaMlaMap = require('../models/AreaMlaMap');
const WardOfficerMap = require('../models/WardOfficerMap');
const IssueResponsibilityMap = require('../models/IssueResponsibilityMap');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

/**
 * GET /api/admin/authority-template
 * Returns a template Excel file
 */
router.get('/authority-template', (req, res) => {
    try {
        const wb = xlsx.utils.book_new();
        const headers = [
            "country", "state", "city", "area_name", "area_alias", 
            "ward_name", "ward_number", "pincode", "zone", 
            "ulb_name", "ulb_type", "department", "issue_types", 
            "officer_name", "officer_designation", "officer_phone", "officer_email", "office_address",
            "escalation_officer_name", "escalation_designation", "escalation_phone", "escalation_email",
            "councillor_name", "councillor_phone", 
            "mla_name", "mla_constituency", "mla_phone", "mla_email",
            "latitude", "longitude"
        ];
        
        const ws = xlsx.utils.aoa_to_sheet([headers]);
        xlsx.utils.book_append_sheet(wb, ws, "Authority_Mapping");
        
        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Disposition', 'attachment; filename="Authority_Template.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Failed to generate template" });
    }
});

/**
 * POST /api/admin/upload-authority-sheet
 * Uploads, parses, and validates the sheet, saving to tracking models
 */
router.post('/upload-authority-sheet', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: "No file uploaded" });
        }

        const uploadedBy = req.body.uploaded_by || 'admin';
        const jobId = 'job_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

        // Read Excel
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

        if (rows.length === 0) {
            return res.status(400).json({ msg: "The uploaded sheet is empty." });
        }

        let validCount = 0;
        let invalidCount = 0;
        const rowDocs = [];

        for (let i = 0; i < rows.length; i++) {
            const rawRow = rows[i];
            const errors = [];
            
            // Normalize header names implicitly by using standard keys
            // Basic validation
            if (!rawRow.area_name) errors.push("Missing area_name");
            if (!rawRow.ward_name && !rawRow.ward_number) errors.push("Missing ward_name or ward_number");
            if (!rawRow.ulb_name) errors.push("Missing ulb_name");
            if (!rawRow.department) errors.push("Missing department");

            const isValid = errors.length === 0;
            if (isValid) validCount++; else invalidCount++;

            rowDocs.push({
                import_job_id: jobId,
                row_index: i + 2, // Excel row number (1 for header + 0-index)
                raw_row: rawRow,
                normalized_row: rawRow, // Could apply trim/lowercase here
                validation_status: isValid ? 'valid' : 'invalid',
                validation_errors: errors
            });
        }

        // Create Job
        const job = await AuthorityImportJob.create({
            job_id: jobId,
            uploaded_by: uploadedBy,
            file_name: req.file.originalname,
            status: 'review',
            total_rows: rows.length,
            valid_rows: validCount,
            invalid_rows: invalidCount,
            city: rows[0].city || 'Unknown',
            state: rows[0].state || 'Unknown'
        });

        // Insert Rows
        await AuthorityImportRow.insertMany(rowDocs);

        res.json({ msg: "Upload successful", job_id: jobId, summary: job });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Failed to process upload" });
    }
});

/**
 * GET /api/admin/preview-authority-sheet/:jobId
 * Returns preview of the uploaded job
 */
router.get('/preview-authority-sheet/:jobId', async (req, res) => {
    try {
        const jobId = req.params.jobId;
        const job = await AuthorityImportJob.findOne({ job_id: jobId });
        if (!job) return res.status(404).json({ msg: "Job not found" });

        const rows = await AuthorityImportRow.find({ import_job_id: jobId }).sort({ row_index: 1 });
        
        res.json({ job, rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Failed to fetch preview" });
    }
});

/**
 * POST /api/admin/import-authority-sheet/:jobId
 * Upserts the validated data into the master authority tables
 */
router.post('/import-authority-sheet/:jobId', async (req, res) => {
    try {
        const jobId = req.params.jobId;
        const job = await AuthorityImportJob.findOne({ job_id: jobId });
        if (!job) return res.status(404).json({ msg: "Job not found" });
        if (job.status === 'imported') return res.status(400).json({ msg: "Job already imported" });

        const validRows = await AuthorityImportRow.find({ import_job_id: jobId, validation_status: 'valid' });
        
        // Setup Upsert logic
        for (const rowDoc of validRows) {
            const data = rowDoc.normalized_row;

            // 1. Upsert ULB Master
            const ulb = await UlbMaster.findOneAndUpdate(
                { ulb_name: data.ulb_name, city: data.city },
                { $set: { ulb_type: data.ulb_type, state: data.state, country: data.country, zone: data.zone } },
                { upsert: true, new: true }
            );

            // 2. Upsert Area -> ULB Map
            await AreaUlbMap.findOneAndUpdate(
                { area_name: data.area_name },
                { $set: { ward_name: data.ward_name, ward_number: String(data.ward_number), pincode: String(data.pincode), ulb_id: ulb._id, ulb_name: data.ulb_name } },
                { upsert: true }
            );

            // 3. Upsert MLA Master & Area -> MLA Map
            if (data.mla_name) {
                const mla = await MlaMaster.findOneAndUpdate(
                    { name: data.mla_name, constituency: data.mla_constituency },
                    { $set: { phone: String(data.mla_phone), email: data.mla_email, state: data.state } },
                    { upsert: true, new: true }
                );
                
                await AreaMlaMap.findOneAndUpdate(
                    { area_name: data.area_name },
                    { $set: { mla_id: mla._id, mla_name: data.mla_name } },
                    { upsert: true }
                );
            }

            // 4. Upsert Ward Officer Map
            if (data.officer_name) {
                await WardOfficerMap.findOneAndUpdate(
                    { ward_name: data.ward_name, department: data.department },
                    { $set: {
                        ward_number: String(data.ward_number),
                        ulb_id: ulb._id,
                        officer_name: data.officer_name,
                        designation: data.officer_designation,
                        phone: String(data.officer_phone),
                        email: data.officer_email,
                        office_address: data.office_address
                    }},
                    { upsert: true }
                );
            }

            // 5. Upsert Issue Responsibility Map (if issue_types provided)
            if (data.issue_types) {
                const issues = String(data.issue_types).split(',').map(s => s.trim());
                for (const issue of issues) {
                    await IssueResponsibilityMap.findOneAndUpdate(
                        { issue_type: issue },
                        { $set: {
                            primary_department: data.department,
                            primary_designation: data.officer_designation,
                            escalation_department: data.department, // Default to same department
                            escalation_designation: data.escalation_designation || 'Head of Department',
                            routing_rationale: `Routed to ${data.department} based on area mapping.`
                        }},
                        { upsert: true }
                    );
                }
            }
        }

        // Mark Job as imported
        job.status = 'imported';
        job.updated_at = Date.now();
        await job.save();

        res.json({ msg: "Import successful", processed_rows: validRows.length });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Failed to commit import" });
    }
});

module.exports = router;
