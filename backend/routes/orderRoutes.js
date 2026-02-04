const express = require("express");
const router = express.Router();
const {
  createOrder,
  getVendorOrders,
  getOrderById,
  updateOrderStatus,
  addTelemetryToOrder,
  getOrderStats,
} = require("../controllers/orderController");
const {
  protect,
  requireEmailVerified,
  requireAdmin,
} = require("../middleware/authMiddleware");
const {
  validateCreateOrder,
  validateOrderId,
} = require("../middleware/validateMiddleware");

// All routes require authentication
router.use(protect);

// @route   POST /api/orders/create
router.post("/create", requireEmailVerified, validateCreateOrder, createOrder);

// @route   GET /api/orders/vendor
router.get("/vendor", getVendorOrders);

// @route   GET /api/orders/stats
router.get("/stats", getOrderStats);

// @route   GET /api/orders/:orderId
router.get("/:orderId", validateOrderId, getOrderById);

// Admin routes
router.put(
  "/:orderId/status",
  requireAdmin,
  validateOrderId,
  updateOrderStatus,
);
router.put("/:orderId/telemetry", validateOrderId, addTelemetryToOrder);

module.exports = router;
