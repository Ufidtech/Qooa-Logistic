const Order = require("../models/Order");
const Vendor = require("../models/Vendor");
const Pricing = require("../models/Pricing");
const { asyncHandler } = require("../middleware/errorMiddleware");
const { sendOrderConfirmationEmail } = require("../utils/emailService");
const whatsappService = require("../utils/whatsappService");

// @desc    Create new order
// @route   POST /api/orders/create
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  const { crateQuantity, deliveryDate, deliveryTime } = req.body;

  // Get current price
  const currentPrice = await Pricing.getCurrentPrice();

  if (!currentPrice) {
    return res.status(400).json({
      success: false,
      message: "No active pricing available. Please contact support.",
    });
  }

  // Create order
  const order = await Order.create({
    vendorId: req.vendor._id,
    crateQuantity,
    pricePerCrate: currentPrice.pricePerCrate,
    deliveryDate: new Date(deliveryDate),
    deliveryTime,
    trackingStages: [
      {
        stage: "confirmed",
        timestamp: new Date(),
        location: "Lagos",
        description: "Order confirmed and awaiting processing",
      },
    ],
  });

  // Update vendor stats
  const vendor = await Vendor.findById(req.vendor._id);
  vendor.totalOrders += 1;
  vendor.totalSpent += order.totalAmount;
  await vendor.save();

  // Send confirmations
  try {
    await Promise.all([
      sendOrderConfirmationEmail(vendor, order),
      whatsappService.sendOrderConfirmation(vendor, order),
    ]);
  } catch (error) {
    console.error("Error sending order confirmations:", error);
  }

  res.status(201).json({
    success: true,
    message: "Order created successfully",
    order: {
      orderId: order.orderId,
      crateQuantity: order.crateQuantity,
      pricePerCrate: order.pricePerCrate,
      totalAmount: order.totalAmount,
      deliveryDate: order.deliveryDate,
      deliveryTime: order.deliveryTime,
      status: order.status,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
    },
  });
});

// @desc    Get vendor's orders
// @route   GET /api/orders/vendor
// @access  Private
const getVendorOrders = asyncHandler(async (req, res) => {
  const { status, startDate, endDate, page = 1, limit = 20 } = req.query;

  // Build query
  const query = { vendorId: req.vendor._id };

  if (status) {
    query.status = status;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  // Get orders with pagination
  const skip = (page - 1) * limit;
  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .select("-telemetry -trackingStages");

  const total = await Order.countDocuments(query);

  res.json({
    success: true,
    orders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// @desc    Get order by ID
// @route   GET /api/orders/:orderId
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    orderId: req.params.orderId,
    vendorId: req.vendor._id,
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  res.json({
    success: true,
    order,
  });
});

// @desc    Update order status (Admin only)
// @route   PUT /api/orders/:orderId/status
// @access  Private/Admin
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, location, description, driverName } = req.body;

  const order = await Order.findOne({ orderId: req.params.orderId });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  // Add tracking stage
  await order.addTrackingStage(status, location, description);

  if (driverName) {
    order.driverName = driverName;
  }

  await order.save();

  // Get vendor for notification
  const vendor = await Vendor.findById(order.vendorId);

  // Send tracking update
  try {
    await whatsappService.sendTrackingUpdate(vendor, order, status);
  } catch (error) {
    console.error("Error sending tracking update:", error);
  }

  res.json({
    success: true,
    message: "Order status updated",
    order: {
      orderId: order.orderId,
      status: order.status,
      trackingStages: order.trackingStages,
    },
  });
});

// @desc    Add telemetry data to order
// @route   PUT /api/orders/:orderId/telemetry
// @access  Private (IoT Device)
const addTelemetryToOrder = asyncHandler(async (req, res) => {
  const { avgTemp, maxTemp, minTemp, gasLevel, freshnessScore } = req.body;

  const order = await Order.findOne({ orderId: req.params.orderId });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  // Update telemetry
  order.telemetry = {
    avgTemp: avgTemp || order.telemetry.avgTemp,
    maxTemp: maxTemp || order.telemetry.maxTemp,
    minTemp: minTemp || order.telemetry.minTemp,
    gasLevel: gasLevel || order.telemetry.gasLevel,
    freshnessScore: freshnessScore || order.telemetry.freshnessScore,
  };

  await order.save();

  // Calculate quality score
  const qualityScore = await order.calculateQualityScore();

  res.json({
    success: true,
    message: "Telemetry updated",
    telemetry: order.telemetry,
    qualityScore,
  });
});

// @desc    Get order statistics
// @route   GET /api/orders/stats
// @access  Private
const getOrderStats = asyncHandler(async (req, res) => {
  const vendorId = req.vendor._id;

  const stats = await Order.aggregate([
    { $match: { vendorId } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: "$totalAmount" },
        totalCrates: { $sum: "$crateQuantity" },
        avgOrderValue: { $avg: "$totalAmount" },
        pendingOrders: {
          $sum: {
            $cond: [
              {
                $in: [
                  "$status",
                  ["confirmed", "in-transit", "at-hub", "out-for-delivery"],
                ],
              },
              1,
              0,
            ],
          },
        },
        deliveredOrders: {
          $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
        },
        cancelledOrders: {
          $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
        },
      },
    },
  ]);

  res.json({
    success: true,
    stats: stats[0] || {
      totalOrders: 0,
      totalSpent: 0,
      totalCrates: 0,
      avgOrderValue: 0,
      pendingOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
    },
  });
});

module.exports = {
  createOrder,
  getVendorOrders,
  getOrderById,
  updateOrderStatus,
  addTelemetryToOrder,
  getOrderStats,
};
