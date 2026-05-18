const User = require("../models/User");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  try {
    const { name, username, email, pass, uid } = req.body;
    const role = "citizen";
    
    const existing = await User.findOne({
      $or: [{ email }, { username }, { uid }],
    });
    if (existing) return res.status(400).json({ msg: "User already exists" });

    await User.create({ role, name, username, email, password: pass, uid });
    res.status(201).json({ msg: "User registered successfully" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

const login = async (req, res) => {
  try {
    const { uname, pass } = req.body;

    const user = await User.findOne({ username: uname });

    if (!user) {
      return res.status(400).json({ msg: "User not found" });
    }

    const isMatch = await user.comparePassword(pass);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid password" });
    }

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
