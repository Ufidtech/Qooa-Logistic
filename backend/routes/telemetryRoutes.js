const express = require("express");
const router = express.Router();
const {
  receiveTelemetryData,
  getOrderTelemetry,
  getTruckTelemetry,
  getTelemetryAlerts,
  getTelemetryStats,
  getTelemetryHeatmap,
} = require("../controllers/telemetryController");
const { protect, requireAdmin } = require("../middleware/authMiddleware");
const { validateTelemetry } = require("../middleware/validateMiddleware");

// IoT device route (public with API key validation)
router.post("/data", validateTelemetry, receiveTelemetryData);

// Protected vendor routes
router.get("/order/:orderId", protect, getOrderTelemetry);

// Admin routes
router.get("/truck/:truckId", protect, requireAdmin, getTruckTelemetry);
router.get("/alerts", protect, requireAdmin, getTelemetryAlerts);
router.get("/stats", protect, requireAdmin, getTelemetryStats);
router.get("/heatmap", protect, requireAdmin, getTelemetryHeatmap);

module.exports = router;
