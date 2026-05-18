const User = require("../models/User");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  try {
    const { role, name, username, email, pass, uid } = req.body;
    
    const existing = await User.findOne({
      $or: [{ email }, { username }, { uid }],
    });
    if (existing) return res.status(400).json({ msg: "User already exists" });

    await User.create({ role: role || "citizen", name, username, email, password: pass, uid });
    res.status(201).json({ msg: "User registered successfully" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

const login = async (req, res) => {
  try {
    const { uname, pass } = req.body;
    console.log("🔐 Login attempt:", { uname, pass });

    // ✅ Special status code bypass for hardcoded Admin & Officer logins (relied on by the frontend)
    if (uname === "admin" && pass === "admin@1234") {
      return res.sendStatus(201);
    }
    if (uname === "officer" && pass === "officer@1234") {
      return res.sendStatus(202);
    }

    console.log("🔍 Searching for user:", uname);
    const user = await User.findOne({ username: uname });
    console.log("👤 User found:", user ? "Yes" : "No");

    if (!user) {
      console.log("❌ User not found");
      return res.status(400).json({ msg: "User not found" });
    }

    // Compare password using bcrypt, falling back to direct string comparison for legacy plain-text accounts
    let isMatch = false;
    try {
      isMatch = await user.comparePassword(pass);
    } catch (err) {
      console.log("⚠️ Bcrypt compare failed (likely legacy plaintext password), falling back to plain string comparison");
    }

    if (!isMatch && user.password === pass) {
      isMatch = true;
    }

    if (!isMatch) {
      console.log("❌ Invalid password");
      return res.status(400).json({ msg: "Invalid password" });
    }

    console.log("✅ Login successful for:", uname);

    const payload = {
      user: {
        id: user.id,
        role: user.role,
        uid: user.uid,
        username: user.username
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || "default_secret_please_change",
      { expiresIn: "5h" },
      (err, token) => {
        if (err) throw err;
        res.status(200).json({ token, uid: user.uid, role: user.role });
      }
    );
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

const removeUser = async (req, res) => {
  try {
    const { username } = req.params;
    await User.deleteOne({ username });
    res.json({ msg: "User removed successfully" });
  } catch (err) {
    console.error("Remove user error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

const updatePushToken = async (req, res) => {
  try {
    const { uid, pushToken } = req.body;
    if (!uid || !pushToken) return res.status(400).json({ msg: "Missing uid or pushToken" });
    await User.findOneAndUpdate({ uid }, { pushToken });
    res.json({ msg: "Push token updated" });
  } catch (err) {
    console.error("Push token update error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

module.exports = {
  register,
  login,
  removeUser,
  updatePushToken
};
