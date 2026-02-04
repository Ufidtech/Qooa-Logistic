const express = require("express");
const router = express.Router();
const {
  submitFeedback,
  getVendorFeedback,
  getFeedbackByOrder,
  updateRefundStatus,
} = require("../controllers/feedbackController");
const {
  protect,
  requireEmailVerified,
  requireAdmin,
} = require("../middleware/authMiddleware");
const { validateFeedback } = require("../middleware/validateMiddleware");
const { uploadMultiple } = require("../utils/uploadService");

// All routes require authentication
router.use(protect);

// @route   POST /api/feedback/submit
router.post(
  "/submit",
  requireEmailVerified,
  uploadMultiple,
  validateFeedback,
  submitFeedback,
);

// @route   GET /api/feedback/vendor
router.get("/vendor", getVendorFeedback);

// @route   GET /api/feedback/order/:orderId
router.get("/order/:orderId", getFeedbackByOrder);

// Admin route
router.put("/:id/refund", requireAdmin, updateRefundStatus);

module.exports = router;
