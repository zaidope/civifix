const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  role: { type: String, enum: ["citizen", "officer", "admin"], default: "citizen" },
  name: String,
  username: String,
  email: String,
  password: String,
  uid: String,
  pushToken: String,
});

module.exports = mongoose.model("users", userSchema);
