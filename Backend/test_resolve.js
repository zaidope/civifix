const { resolveAuthorityChain } = require('./services/authorityResolver');
const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB");
  const result = await resolveAuthorityChain("Pothole", null, null, "Shivajinagar, Bengaluru, Karnataka 560001, India");
  console.log(JSON.stringify(result, null, 2));
  mongoose.disconnect();
}
test().catch(console.error);
