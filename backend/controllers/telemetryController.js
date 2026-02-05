const Telemetry = require("../models/Telemetry");
const Order = require("../models/Order");
const Vendor = require("../models/VendorRegistration");
const whatsappService = require("../utils/whatsappService");
const { asyncHandler } = require("../middleware/errorMiddleware");

// @desc    Receive telemetry data from IoT device
// @route   POST /api/telemetry/data
// @access  Public (IoT Device with API key)
const receiveTelemetryData = asyncHandler(async (req, res) => {
  const {
    orderId,
    truckId,
    temperature,
    humidity,
    gasLevel,
    location,
    batteryLevel,
    networkAvailable,
  } = req.body;

  // Verify order exists
  const order = await Order.findOne({ orderId });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  // Create telemetry record
  const telemetry = await Telemetry.create({
    orderId,
    truckId,
    temperature,
    humidity,
    gasLevel,
    location: location
      ? {
          type: "Point",
          coordinates: [location.longitude, location.latitude],
        }
      : undefined,
    batteryLevel,
    networkAvailable,
    recordedAt: new Date(),
    syncedAt: new Date(),
  });

  // Check for alerts
  const alerts = await telemetry.checkAlerts();

  // If there are critical alerts, notify vendor
  if (alerts.length > 0) {
    const vendor = await Vendor.findById(order.vendorId);

    for (const alert of alerts) {
      if (alert.severity === "critical") {
        try {
          await whatsappService.sendQualityAlert(vendor, order, alert.type);
        } catch (error) {
          console.error("Error sending quality alert:", error);
        }
      }
    }
  }

  res.status(201).json({
    success: true,
    message: "Telemetry data received",
    telemetry: {
      id: telemetry._id,
      orderId: telemetry.orderId,
      temperature: telemetry.temperature,
      gasLevel: telemetry.gasLevel,
      alerts: telemetry.alerts,
    },
  });
});

// @desc    Get telemetry data for an order
// @route   GET /api/telemetry/order/:orderId
// @access  Private
const getOrderTelemetry = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  // Verify order belongs to vendor
  const order = await Order.findOne({
    orderId,
    vendorId: req.vendor._id,
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  // Get all telemetry data for this order
  const telemetryData = await Telemetry.find({ orderId }).sort({
    recordedAt: 1,
  });

  // Get summary
  const summary = await Telemetry.getOrderSummary(orderId);

  res.json({
    success: true,
    telemetry: telemetryData,
    summary,
  });
});

// @desc    Get latest telemetry for a truck
// @route   GET /api/telemetry/truck/:truckId
// @access  Private/Admin
const getTruckTelemetry = asyncHandler(async (req, res) => {
  const { truckId } = req.params;
  const { limit = 100 } = req.query;

  const telemetryData = await Telemetry.find({ truckId })
    .sort({ recordedAt: -1 })
    .limit(parseInt(limit))
    .populate("orderId", "orderId vendorId deliveryDate");

  res.json({
    success: true,
    telemetry: telemetryData,
  });
});

// @desc    Get telemetry alerts
// @route   GET /api/telemetry/alerts
// @access  Private/Admin
const getTelemetryAlerts = asyncHandler(async (req, res) => {
  const { severity, startDate, endDate } = req.query;

  // Build query for records with alerts
  const query = {
    alerts: { $exists: true, $ne: [] },
  };

  if (startDate || endDate) {
    query.recordedAt = {};
    if (startDate) query.recordedAt.$gte = new Date(startDate);
    if (endDate) query.recordedAt.$lte = new Date(endDate);
  }

  let telemetryData = await Telemetry.find(query)
    .sort({ recordedAt: -1 })
    .limit(100)
    .populate("orderId", "orderId vendorId deliveryDate");

  // Filter by severity if specified
  if (severity) {
    telemetryData = telemetryData.filter((t) =>
      t.alerts.some((alert) => alert.severity === severity),
    );
  }

  res.json({
    success: true,
    alerts: telemetryData,
  });
});

// @desc    Get telemetry statistics
// @route   GET /api/telemetry/stats
// @access  Private/Admin
const getTelemetryStats = asyncHandler(async (req, res) => {
  const { truckId, startDate, endDate } = req.query;

  const query = {};
  if (truckId) query.truckId = truckId;
  if (startDate || endDate) {
    query.recordedAt = {};
    if (startDate) query.recordedAt.$gte = new Date(startDate);
    if (endDate) query.recordedAt.$lte = new Date(endDate);
  }

  const stats = await Telemetry.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        avgTemperature: { $avg: "$temperature" },
        maxTemperature: { $max: "$temperature" },
        minTemperature: { $min: "$temperature" },
        avgGasLevel: { $avg: "$gasLevel" },
        maxGasLevel: { $max: "$gasLevel" },
        avgBattery: { $avg: "$batteryLevel" },
        totalRecords: { $sum: 1 },
        totalAlerts: { $sum: { $size: { $ifNull: ["$alerts", []] } } },
      },
    },
  ]);

  res.json({
    success: true,
    stats: stats[0] || {
      avgTemperature: 0,
      maxTemperature: 0,
      minTemperature: 0,
      avgGasLevel: 0,
      maxGasLevel: 0,
      avgBattery: 0,
      totalRecords: 0,
      totalAlerts: 0,
    },
  });
});

// @desc    Get telemetry heatmap data (geospatial)
// @route   GET /api/telemetry/heatmap
// @access  Private/Admin
const getTelemetryHeatmap = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const query = {
    location: { $exists: true },
  };

  if (startDate || endDate) {
    query.recordedAt = {};
    if (startDate) query.recordedAt.$gte = new Date(startDate);
    if (endDate) query.recordedAt.$lte = new Date(endDate);
  }

  const heatmapData = await Telemetry.find(query)
    .select("location temperature gasLevel recordedAt alerts")
    .sort({ recordedAt: -1 })
    .limit(1000);

  res.json({
    success: true,
    heatmap: heatmapData.map((t) => ({
      latitude: t.location.coordinates[1],
      longitude: t.location.coordinates[0],
      temperature: t.temperature,
      gasLevel: t.gasLevel,
      hasAlerts: t.alerts && t.alerts.length > 0,
      timestamp: t.recordedAt,
    })),
  });
});

module.exports = {
  receiveTelemetryData,
  getOrderTelemetry,
  getTruckTelemetry,
  getTelemetryAlerts,
  getTelemetryStats,
  getTelemetryHeatmap,
};
