const { Worker } = require("bullmq");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const { connection } = require("./complaintQueue");
const Complaint = require("../models/Complaint");
const Zone = require("../models/Zone");
const {
  calculate_bbox_severity,
  check_main_road,
  calculate_priority_score,
} = require("../priorityUtils");
const { update_zone_statistics } = require("../zonesUtils");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, '../.env') });

const uploadsDir = path.join(__dirname, '../uploads');

// Connect DB for standalone worker process, or reuse existing if required directly
if (mongoose.connection.readyState === 0) {
  mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/citizen_grievance")
    .then(() => console.log("Worker connected to DB"))
    .catch(err => console.error("Worker DB connection failed:", err));
}

const worker = new Worker("complaintQueue", async job => {
  const { complaintId, imagePaths, latitude, longitude, zoneId, duplicatePriority } = job.data;
  console.log(`[Worker] Processing complaint ${complaintId}`);

  let baseSeverity = 1;
  let prediction = null;

  try {
    if (imagePaths && imagePaths.length > 0) {
      const imagePath = path.join(uploadsDir, imagePaths[0]);
      if (fs.existsSync(imagePath)) {
        const form = new FormData();
        form.append("file", fs.createReadStream(imagePath));
        try {
          const resp = await axios.post("http://127.0.0.1:9000/predict", form, {
            headers: form.getHeaders(),
            timeout: 15000,
          });
          prediction = resp.data;
          if (prediction && prediction.bbox && typeof prediction.image_width === "number") {
            baseSeverity = calculate_bbox_severity({
              bbox: {
                x1: prediction.bbox.x1, y1: prediction.bbox.y1,
                x2: prediction.bbox.x2, y2: prediction.bbox.y2,
              },
              imageWidth: prediction.image_width,
              imageHeight: prediction.image_height,
            });
          }
        } catch (err) {
          console.error(`[Worker] AI inference failed for ${complaintId}`);
        }
      }
    }

    const { isMainRoad, roadPriority } = await check_main_road(latitude, longitude);

    const { priorityScore, priorityLevel } = calculate_priority_score({
      baseSeverity,
      duplicatePriority,
      roadPriority,
    });

    await Complaint.findByIdAndUpdate(complaintId, {
      severity_level: baseSeverity,
      priority_score: priorityScore,
      priority_level: priorityLevel
    });

    if (zoneId) {
      await update_zone_statistics(Zone, zoneId, priorityLevel);
    }

    console.log(`[Worker] Completed processing for ${complaintId}. Priority: ${priorityLevel}`);
    return { priorityLevel };
  } catch (error) {
    console.error(`[Worker] Job failed for ${complaintId}:`, error);
    throw error;
  }
}, { connection });

worker.on("completed", job => console.log(`Job ${job.id} completed.`));
worker.on("failed", (job, err) => console.log(`Job ${job.id} failed:`, err.message));

module.exports = worker;
