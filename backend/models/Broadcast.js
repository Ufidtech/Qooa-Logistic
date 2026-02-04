const mongoose = require("mongoose");

const broadcastSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
    },
    messagePidgin: String,
    targetMarket: String, // null means all markets
    targetVendors: [String], // Array of vendorIds, empty means all
    sentVia: {
      type: String,
      enum: ["whatsapp", "email", "both"],
      default: "whatsapp",
    },
    recipientCount: Number,
    successCount: Number,
    failureCount: Number,
    status: {
      type: String,
      enum: ["pending", "sending", "completed", "failed"],
      default: "pending",
    },
    sentBy: String,
    scheduledFor: Date,
    completedAt: Date,
    errors: [
      {
        vendorId: String,
        error: String,
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Index
broadcastSchema.index({ status: 1 });
broadcastSchema.index({ createdAt: -1 });

const Broadcast = mongoose.model("Broadcast", broadcastSchema);

module.exports = Broadcast;
