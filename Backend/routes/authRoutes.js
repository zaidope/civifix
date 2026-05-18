const express = require("express");
const router = express.Router();
const { register, login, removeUser, updatePushToken } = require("../controllers/authController");
const { authMiddleware, requireRole } = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.delete("/removeUser/:username", authMiddleware, requireRole(["admin"]), removeUser);
router.post("/update-push-token", authMiddleware, updatePushToken);

module.exports = router;
