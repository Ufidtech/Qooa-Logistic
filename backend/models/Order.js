const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      required: true,
    },
    vendorId: {
      type: String,
      required: true,
      ref: "Vendor",
    },
    vendorName: String,
    marketCluster: String,
    stallNumber: String,
    crateQuantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: 1,
    },
    pricePerCrate: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    deliveryDate: {
      type: Date,
      required: true,
    },
    deliveryTime: {
      type: String,
      enum: ["morning", "midday", "afternoon"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "confirmed",
        "in-transit",
        "at-hub",
        "out-for-delivery",
        "delivered",
        "cancelled",
      ],
      default: "confirmed",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["paystack", "bank-transfer", "cash"],
    },
    transactionReference: String,
    paystackReference: String,
    truckId: String,
    driverName: String,
    driverPhone: String,
    trackingStages: [
      {
        stage: {
          type: String,
          required: true,
        },
        location: String,
        notes: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        completed: {
          type: Boolean,
          default: true,
        },
      },
    ],
    telemetry: {
      avgTemp: Number,
      maxTemp: Number,
      minTemp: Number,
      avgHumidity: Number,
      maxGasLevel: Number,
      freshnessScore: Number,
      transitDuration: Number, // in seconds
    },
    feedback: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Feedback",
    },
    paidAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
  },
  {
    timestamps: true,
  },
);

// Indexes
orderSchema.index({ vendorId: 1, status: 1 });
orderSchema.index({ orderId: 1 });
orderSchema.index({ deliveryDate: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });

// Generate order ID
orderSchema.statics.generateOrderId = function () {
  return "ORD" + Date.now().toString().slice(-8);
};

// Add tracking stage
orderSchema.methods.addTrackingStage = function (stage, location, notes) {
  this.trackingStages.push({
    stage,
    location,
    notes,
    timestamp: new Date(),
    completed: true,
  });
  this.status = stage;
};

// Calculate quality score based on telemetry
orderSchema.methods.calculateQualityScore = function () {
  if (!this.telemetry) return 100;

  let score = 100;
  const { avgTemp, maxGasLevel, transitDuration } = this.telemetry;

  // Temperature penalty
  if (avgTemp > 28) score -= (avgTemp - 28) * 5;
  if (avgTemp > 32) score -= 20;

  // Gas level penalty
  if (maxGasLevel > 80) score -= (maxGasLevel - 80) * 0.5;
  if (maxGasLevel > 120) score -= 30;

  // Transit time penalty
  const transitHours = transitDuration / 3600;
  if (transitHours > 24) score -= (transitHours - 24) * 2;

  this.telemetry.freshnessScore = Math.max(0, Math.min(100, score));
  return this.telemetry.freshnessScore;
};

// Pre-save middleware to calculate total amount
orderSchema.pre("save", function (next) {
  if (this.isModified("crateQuantity") || this.isModified("pricePerCrate")) {
    this.totalAmount = this.crateQuantity * this.pricePerCrate;
  }
  next();
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
