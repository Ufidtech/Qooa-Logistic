const express = require("express");
const router = express.Router();
const {
  getCurrentPrice,
  getPriceHistory,
  updatePrice,
  getPriceStats,
  deactivatePrice,
} = require("../controllers/pricingController");
const { protect, requireAdmin } = require("../middleware/authMiddleware");
const { validatePricing } = require("../middleware/validateMiddleware");

// Public routes
router.get("/current", getCurrentPrice);
router.get("/history", getPriceHistory);
router.get("/stats", getPriceStats);

// Admin routes
router.post("/update", protect, requireAdmin, validatePricing, updatePrice);
router.put("/:id/deactivate", protect, requireAdmin, deactivatePrice);

module.exports = router;
