const Pricing = require("../models/Pricing");
const { asyncHandler } = require("../middleware/errorMiddleware");

// @desc    Get current active price
// @route   GET /api/pricing/current
// @access  Public
const getCurrentPrice = asyncHandler(async (req, res) => {
  const currentPrice = await Pricing.getCurrentPrice();

  if (!currentPrice) {
    return res.status(404).json({
      success: false,
      message: "No active pricing available",
    });
  }

  res.json({
    success: true,
    pricing: {
      pricePerCrate: currentPrice.pricePerCrate,
      currency: currentPrice.currency,
      effectiveFrom: currentPrice.effectiveFrom,
      effectiveTo: currentPrice.effectiveTo,
      trend: currentPrice.trend,
      marketFactor: currentPrice.marketFactor,
    },
  });
});

// @desc    Get price history
// @route   GET /api/pricing/history
// @access  Public
const getPriceHistory = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const priceHistory = await Pricing.find()
    .sort({ effectiveFrom: -1 })
    .limit(parseInt(limit))
    .select("pricePerCrate effectiveFrom effectiveTo trend isActive");

  res.json({
    success: true,
    priceHistory,
  });
});

// @desc    Update price (Admin only)
// @route   POST /api/pricing/update
// @access  Private/Admin
const updatePrice = asyncHandler(async (req, res) => {
  const { pricePerCrate, effectiveFrom, effectiveTo, marketFactor, trend } =
    req.body;

  // Create new price (pre-save hook will deactivate old ones)
  const newPrice = await Pricing.create({
    pricePerCrate,
    effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
    effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
    marketFactor: marketFactor || 1.0,
    trend: trend || "stable",
    isActive: true,
  });

  res.status(201).json({
    success: true,
    message: "Price updated successfully",
    pricing: {
      id: newPrice._id,
      pricePerCrate: newPrice.pricePerCrate,
      effectiveFrom: newPrice.effectiveFrom,
      effectiveTo: newPrice.effectiveTo,
      trend: newPrice.trend,
      isActive: newPrice.isActive,
    },
  });
});

// @desc    Get price statistics
// @route   GET /api/pricing/stats
// @access  Public
const getPriceStats = asyncHandler(async (req, res) => {
  const stats = await Pricing.aggregate([
    {
      $group: {
        _id: null,
        avgPrice: { $avg: "$pricePerCrate" },
        minPrice: { $min: "$pricePerCrate" },
        maxPrice: { $max: "$pricePerCrate" },
        currentPrice: { $last: "$pricePerCrate" },
      },
    },
  ]);

  res.json({
    success: true,
    stats: stats[0] || {
      avgPrice: 0,
      minPrice: 0,
      maxPrice: 0,
      currentPrice: 0,
    },
  });
});

// @desc    Deactivate price (Admin only)
// @route   PUT /api/pricing/:id/deactivate
// @access  Private/Admin
const deactivatePrice = asyncHandler(async (req, res) => {
  const price = await Pricing.findById(req.params.id);

  if (!price) {
    return res.status(404).json({
      success: false,
      message: "Price not found",
    });
  }

  price.isActive = false;
  price.effectiveTo = new Date();
  await price.save();

  res.json({
    success: true,
    message: "Price deactivated successfully",
  });
});

module.exports = {
  getCurrentPrice,
  getPriceHistory,
  updatePrice,
  getPriceStats,
  deactivatePrice,
};
