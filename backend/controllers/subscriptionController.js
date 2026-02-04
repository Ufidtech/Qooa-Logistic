const Subscription = require("../models/Subscription");
const { asyncHandler } = require("../middleware/errorMiddleware");
const whatsappService = require("../utils/whatsappService");

// @desc    Create subscription (standing order)
// @route   POST /api/subscriptions/create
// @access  Private
const createSubscription = asyncHandler(async (req, res) => {
  const { crateQuantity, frequency, deliveryTime } = req.body;

  // Check if subscription already exists for this day
  const existingSubscription = await Subscription.findOne({
    vendorId: req.vendor._id,
    frequency,
    status: "active",
  });

  if (existingSubscription) {
    return res.status(400).json({
      success: false,
      message: `You already have an active subscription for ${frequency}`,
    });
  }

  // Create subscription
  const subscription = await Subscription.create({
    vendorId: req.vendor._id,
    crateQuantity,
    frequency,
    deliveryTime,
  });

  // Calculate next order date
  await subscription.calculateNextOrderDate();
  await subscription.save();

  res.status(201).json({
    success: true,
    message: "Subscription created successfully",
    subscription: {
      id: subscription._id,
      crateQuantity: subscription.crateQuantity,
      frequency: subscription.frequency,
      deliveryTime: subscription.deliveryTime,
      nextOrderDate: subscription.nextOrderDate,
      status: subscription.status,
    },
  });
});

// @desc    Get vendor subscriptions
// @route   GET /api/subscriptions
// @access  Private
const getVendorSubscriptions = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const query = { vendorId: req.vendor._id };
  if (status) {
    query.status = status;
  }

  const subscriptions = await Subscription.find(query).sort({ createdAt: -1 });

  res.json({
    success: true,
    subscriptions,
  });
});

// @desc    Update subscription
// @route   PUT /api/subscriptions/:id
// @access  Private
const updateSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({
    _id: req.params.id,
    vendorId: req.vendor._id,
  });

  if (!subscription) {
    return res.status(404).json({
      success: false,
      message: "Subscription not found",
    });
  }

  // Update allowed fields
  if (req.body.crateQuantity) {
    subscription.crateQuantity = req.body.crateQuantity;
  }
  if (req.body.deliveryTime) {
    subscription.deliveryTime = req.body.deliveryTime;
  }

  await subscription.save();

  res.json({
    success: true,
    message: "Subscription updated successfully",
    subscription,
  });
});

// @desc    Cancel subscription
// @route   PUT /api/subscriptions/:id/cancel
// @access  Private
const cancelSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({
    _id: req.params.id,
    vendorId: req.vendor._id,
  });

  if (!subscription) {
    return res.status(404).json({
      success: false,
      message: "Subscription not found",
    });
  }

  subscription.status = "cancelled";
  await subscription.save();

  res.json({
    success: true,
    message: "Subscription cancelled successfully",
  });
});

// @desc    Pause/Resume subscription
// @route   PUT /api/subscriptions/:id/toggle
// @access  Private
const toggleSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({
    _id: req.params.id,
    vendorId: req.vendor._id,
  });

  if (!subscription) {
    return res.status(404).json({
      success: false,
      message: "Subscription not found",
    });
  }

  if (subscription.status === "cancelled") {
    return res.status(400).json({
      success: false,
      message: "Cannot modify cancelled subscription",
    });
  }

  subscription.status = subscription.status === "active" ? "paused" : "active";

  if (subscription.status === "active") {
    await subscription.calculateNextOrderDate();
  }

  await subscription.save();

  res.json({
    success: true,
    message: `Subscription ${subscription.status}`,
    subscription,
  });
});

module.exports = {
  createSubscription,
  getVendorSubscriptions,
  updateSubscription,
  cancelSubscription,
  toggleSubscription,
};
