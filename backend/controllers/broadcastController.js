const Broadcast = require("../models/Broadcast");
const Vendor = require("../models/Vendor");
const whatsappService = require("../utils/whatsappService");
const { sendBroadcastEmail } = require("../utils/emailService");
const { asyncHandler } = require("../middleware/errorMiddleware");

// @desc    Send broadcast message
// @route   POST /api/broadcast/send
// @access  Private/Admin
const sendBroadcast = asyncHandler(async (req, res) => {
  const { message, messagePidgin, targetMarket, targetVendors, sentVia } =
    req.body;

  // Build query to get target vendors
  const query = { status: "active" };

  if (targetMarket) {
    query.marketCluster = targetMarket;
  }

  if (targetVendors && targetVendors.length > 0) {
    query._id = { $in: targetVendors };
  }

  // Get vendors
  const vendors = await Vendor.find(query);

  if (vendors.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No vendors found matching the criteria",
    });
  }

  // Create broadcast record
  const broadcast = await Broadcast.create({
    message,
    messagePidgin,
    targetMarket,
    targetVendors: vendors.map((v) => v._id),
    sentVia,
    recipientCount: vendors.length,
    status: "sending",
  });

  // Send messages asynchronously
  (async () => {
    let successCount = 0;
    let failureCount = 0;
    const errors = [];

    for (const vendor of vendors) {
      try {
        // Send via WhatsApp
        if (sentVia === "whatsapp" || sentVia === "both") {
          const msg = vendor.language === "pidgin" ? messagePidgin : message;
          await whatsappService.sendMessage(
            vendor.phoneNumber,
            msg,
            vendor.language,
          );
        }

        // Send via Email
        if (sentVia === "email" || sentVia === "both") {
          if (vendor.email && vendor.emailVerified) {
            const msg = vendor.language === "pidgin" ? messagePidgin : message;
            // Implement email broadcast function
            // await sendBroadcastEmail(vendor, msg);
          }
        }

        successCount++;

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        failureCount++;
        errors.push({
          vendorId: vendor.vendorId,
          error: error.message,
        });
      }
    }

    // Update broadcast status
    broadcast.successCount = successCount;
    broadcast.failureCount = failureCount;
    broadcast.errors = errors;
    broadcast.status = failureCount === 0 ? "completed" : "partial";
    await broadcast.save();
  })();

  res.status(202).json({
    success: true,
    message: "Broadcast message is being sent",
    broadcast: {
      id: broadcast._id,
      recipientCount: broadcast.recipientCount,
      status: broadcast.status,
    },
  });
});

// @desc    Get broadcast history
// @route   GET /api/broadcast/history
// @access  Private/Admin
const getBroadcastHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;

  const query = {};
  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;
  const broadcasts = await Broadcast.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .select("-errors");

  const total = await Broadcast.countDocuments(query);

  res.json({
    success: true,
    broadcasts,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// @desc    Get broadcast details by ID
// @route   GET /api/broadcast/:id
// @access  Private/Admin
const getBroadcastById = asyncHandler(async (req, res) => {
  const broadcast = await Broadcast.findById(req.params.id).populate(
    "targetVendors",
    "vendorId vendorName phoneNumber marketCluster",
  );

  if (!broadcast) {
    return res.status(404).json({
      success: false,
      message: "Broadcast not found",
    });
  }

  res.json({
    success: true,
    broadcast,
  });
});

// @desc    Get broadcast statistics
// @route   GET /api/broadcast/stats
// @access  Private/Admin
const getBroadcastStats = asyncHandler(async (req, res) => {
  const stats = await Broadcast.aggregate([
    {
      $group: {
        _id: null,
        totalBroadcasts: { $sum: 1 },
        totalRecipients: { $sum: "$recipientCount" },
        totalSuccess: { $sum: "$successCount" },
        totalFailed: { $sum: "$failureCount" },
        avgSuccessRate: {
          $avg: { $divide: ["$successCount", "$recipientCount"] },
        },
      },
    },
  ]);

  res.json({
    success: true,
    stats: stats[0] || {
      totalBroadcasts: 0,
      totalRecipients: 0,
      totalSuccess: 0,
      totalFailed: 0,
      avgSuccessRate: 0,
    },
  });
});

module.exports = {
  sendBroadcast,
  getBroadcastHistory,
  getBroadcastById,
  getBroadcastStats,
};
