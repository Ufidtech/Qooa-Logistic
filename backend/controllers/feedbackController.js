const Feedback = require("../models/Feedback");
const Order = require("../models/Order");
const Vendor = require("../models/VendorRegistration");
const { asyncHandler } = require("../middleware/errorMiddleware");
const { uploadToCloudinary } = require("../utils/uploadService");

// @desc    Submit feedback
// @route   POST /api/feedback/submit
// @access  Private
const submitFeedback = asyncHandler(async (req, res) => {
  const { orderId, rating, comments, hasDamageReport, refundAmount } = req.body;

  // Check if order exists and belongs to vendor
  const order = await Order.findOne({
    orderId,
    vendorId: req.vendor._id,
    status: "delivered",
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found or not yet delivered",
    });
  }

  // Check if feedback already exists
  const existingFeedback = await Feedback.findOne({ orderId });
  if (existingFeedback) {
    return res.status(400).json({
      success: false,
      message: "Feedback already submitted for this order",
    });
  }

  // Handle damage photos if uploaded
  const damagePhotos = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      try {
        const result = await uploadToCloudinary(file.buffer);
        damagePhotos.push({
          url: result.secure_url,
          publicId: result.public_id,
        });
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    }
  }

  // Create feedback
  const feedback = await Feedback.create({
    orderId,
    vendorId: req.vendor._id,
    rating,
    comments,
    hasDamageReport: hasDamageReport || damagePhotos.length > 0,
    damagePhotos,
    refundAmount: refundAmount || 0,
    refundStatus: refundAmount > 0 ? "pending" : "none",
  });

  // Update order with feedback reference
  order.feedbackSubmitted = true;
  await order.save();

  res.status(201).json({
    success: true,
    message: "Feedback submitted successfully",
    feedback: {
      id: feedback._id,
      orderId: feedback.orderId,
      rating: feedback.rating,
      comments: feedback.comments,
      hasDamageReport: feedback.hasDamageReport,
      damagePhotos: feedback.damagePhotos,
      refundStatus: feedback.refundStatus,
    },
  });
});

// @desc    Get vendor feedback history
// @route   GET /api/feedback/vendor
// @access  Private
const getVendorFeedback = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const skip = (page - 1) * limit;
  const feedback = await Feedback.find({ vendorId: req.vendor._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate("orderId", "orderId deliveryDate crateQuantity totalAmount");

  const total = await Feedback.countDocuments({ vendorId: req.vendor._id });

  // Calculate average rating
  const avgRating = await Feedback.aggregate([
    { $match: { vendorId: req.vendor._id } },
    { $group: { _id: null, avgRating: { $avg: "$rating" } } },
  ]);

  res.json({
    success: true,
    feedback,
    averageRating: avgRating[0]?.avgRating || 0,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// @desc    Get feedback by order ID
// @route   GET /api/feedback/order/:orderId
// @access  Private
const getFeedbackByOrder = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findOne({
    orderId: req.params.orderId,
    vendorId: req.vendor._id,
  }).populate("orderId");

  if (!feedback) {
    return res.status(404).json({
      success: false,
      message: "Feedback not found for this order",
    });
  }

  res.json({
    success: true,
    feedback,
  });
});

// @desc    Update refund status (Admin only)
// @route   PUT /api/feedback/:id/refund
// @access  Private/Admin
const updateRefundStatus = asyncHandler(async (req, res) => {
  const { refundStatus, adminNotes } = req.body;

  const feedback = await Feedback.findById(req.params.id);

  if (!feedback) {
    return res.status(404).json({
      success: false,
      message: "Feedback not found",
    });
  }

  feedback.refundStatus = refundStatus;
  if (adminNotes) {
    feedback.comments += `\n\nAdmin Notes: ${adminNotes}`;
  }
  await feedback.save();

  res.json({
    success: true,
    message: "Refund status updated",
    feedback: {
      id: feedback._id,
      refundStatus: feedback.refundStatus,
      refundAmount: feedback.refundAmount,
    },
  });
});

module.exports = {
  submitFeedback,
  getVendorFeedback,
  getFeedbackByOrder,
  updateRefundStatus,
};
