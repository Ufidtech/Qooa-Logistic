const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      ref: "Order",
    },
    vendorId: {
      type: String,
      required: true,
      ref: "Vendor",
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comments: {
      type: String,
      maxlength: 1000,
    },
    hasDamageReport: {
      type: Boolean,
      default: false,
    },
    damagePhotos: [
      {
        url: String,
        publicId: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    refundAmount: Number,
    refundStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected", "completed"],
      default: "none",
    },
    refundReason: String,
    adminResponse: String,
    adminRespondedAt: Date,
  },
  {
    timestamps: true,
  },
);

// Indexes
feedbackSchema.index({ orderId: 1 });
feedbackSchema.index({ vendorId: 1 });
feedbackSchema.index({ rating: 1 });

// Update vendor quality score after feedback
feedbackSchema.post("save", async function (doc) {
  const Vendor = mongoose.model("Vendor");
  const vendor = await Vendor.findOne({ vendorId: doc.vendorId });
  if (vendor) {
    await vendor.updateQualityScore();
  }
});

const Feedback = mongoose.model("Feedback", feedbackSchema);

module.exports = Feedback;
