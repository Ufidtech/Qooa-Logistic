const mongoose = require("mongoose");

const pricingSchema = new mongoose.Schema(
  {
    pricePerCrate: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "NGN",
    },
    effectiveFrom: {
      type: Date,
      required: true,
      default: Date.now,
    },
    effectiveTo: Date,
    marketFactor: {
      type: Number,
      default: 1.0,
    },
    trend: {
      type: String,
      enum: ["up", "down", "stable"],
      default: "stable",
    },
    notes: String,
    createdBy: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Index
pricingSchema.index({ effectiveFrom: -1 });
pricingSchema.index({ isActive: 1 });

// Get current active price
pricingSchema.statics.getCurrentPrice = async function () {
  const now = new Date();
  const price = await this.findOne({
    isActive: true,
    effectiveFrom: { $lte: now },
    $or: [{ effectiveTo: { $gte: now } }, { effectiveTo: null }],
  }).sort({ effectiveFrom: -1 });

  return (
    price ||
    (await this.findOne({ isActive: true }).sort({ effectiveFrom: -1 }))
  );
};

// Deactivate previous prices when new one is added
pricingSchema.pre("save", async function (next) {
  if (this.isNew && this.isActive) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id }, isActive: true },
      { isActive: false, effectiveTo: this.effectiveFrom },
    );
  }
  next();
});

const Pricing = mongoose.model("Pricing", pricingSchema);

module.exports = Pricing;
