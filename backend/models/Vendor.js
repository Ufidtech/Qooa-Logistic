const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const vendorSchema = new mongoose.Schema(
  {
    vendorId: {
      type: String,
      unique: true,
      required: true,
    },
    vendorName: {
      type: String,
      required: [true, "Vendor name is required"],
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true, // Allows multiple null values
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    password: {
      type: String,
      select: false, // Don't return password by default
    },
    marketCluster: {
      type: String,
      required: [true, "Market cluster is required"],
    },
    otherMarket: String,
    stallNumber: {
      type: String,
      required: [true, "Stall number is required"],
    },
    businessType: {
      type: String,
      enum: ["mama-put", "retailer", "wholesaler", "restaurant", "caterer"],
      required: true,
    },
    orderSize: {
      type: String,
      enum: ["1-2", "3-5", "6-10", "10+"],
    },
    language: {
      type: String,
      enum: ["en", "pidgin"],
      default: "en",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
    qualityScore: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    lastLogin: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Index for faster queries
vendorSchema.index({ phoneNumber: 1 });
vendorSchema.index({ email: 1 });
vendorSchema.index({ marketCluster: 1 });
vendorSchema.index({ status: 1 });

// Virtual for vendor's orders
vendorSchema.virtual("orders", {
  ref: "Order",
  localField: "vendorId",
  foreignField: "vendorId",
});

// Hash password before saving
vendorSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  if (this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// Compare password method
vendorSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate vendor ID
vendorSchema.statics.generateVendorId = function () {
  return "VEN" + Date.now().toString().slice(-8);
};

// Update quality score based on feedback
vendorSchema.methods.updateQualityScore = async function () {
  const Feedback = mongoose.model("Feedback");
  const feedbacks = await Feedback.find({ vendorId: this.vendorId });

  if (feedbacks.length > 0) {
    const avgRating =
      feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;
    this.qualityScore = parseFloat(avgRating.toFixed(1));
    await this.save();
  }
};

const Vendor = mongoose.model("Vendor", vendorSchema);

module.exports = Vendor;
