const express = require("express");
const router = express.Router();
const {
  sendBroadcast,
  getBroadcastHistory,
  getBroadcastById,
  getBroadcastStats,
} = require("../controllers/broadcastController");
const { protect, requireAdmin } = require("../middleware/authMiddleware");
const { validateBroadcast } = require("../middleware/validateMiddleware");

// All routes require admin authentication
router.use(protect);
router.use(requireAdmin);

// @route   POST /api/broadcast/send
router.post("/send", validateBroadcast, sendBroadcast);

// @route   GET /api/broadcast/history
router.get("/history", getBroadcastHistory);

// @route   GET /api/broadcast/stats
router.get("/stats", getBroadcastStats);

// @route   GET /api/broadcast/:id
router.get("/:id", getBroadcastById);

module.exports = router;
