const { Queue } = require("bullmq");

// Use Redis URL from env or fallback to localhost
const connection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,
};

const complaintQueue = new Queue("complaintQueue", { connection });

module.exports = { complaintQueue, connection };
