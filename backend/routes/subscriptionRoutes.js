const express = require("express");
const router = express.Router();
const {
  createSubscription,
  getVendorSubscriptions,
  updateSubscription,
  cancelSubscription,
  toggleSubscription,
} = require("../controllers/subscriptionController");
const {
  protect,
  requireEmailVerified,
} = require("../middleware/authMiddleware");
const {
  validateCreateSubscription,
} = require("../middleware/validateMiddleware");

// All routes require authentication
router.use(protect);
router.use(requireEmailVerified);

// @route   POST /api/subscriptions/create
router.post("/create", validateCreateSubscription, createSubscription);

// @route   GET /api/subscriptions
router.get("/", getVendorSubscriptions);

// @route   PUT /api/subscriptions/:id
router.put("/:id", updateSubscription);

// @route   PUT /api/subscriptions/:id/cancel
router.put("/:id/cancel", cancelSubscription);

// @route   PUT /api/subscriptions/:id/toggle
router.put("/:id/toggle", toggleSubscription);

module.exports = router;
