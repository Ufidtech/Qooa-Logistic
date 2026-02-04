const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    vendorId: {
      type: String,
      required: true,
      ref: "Vendor",
    },
    crateQuantity: {
      type: Number,
      required: true,
      min: 1,
    },
    frequency: {
      type: String,
      enum: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ],
      required: true,
    },
    deliveryTime: {
      type: String,
      enum: ["morning", "midday", "afternoon"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "paused", "cancelled"],
      default: "active",
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: Date,
    nextOrderDate: Date,
    lastOrderDate: Date,
    ordersGenerated: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Index
subscriptionSchema.index({ vendorId: 1, status: 1 });
subscriptionSchema.index({ nextOrderDate: 1 });

// Calculate next order date
subscriptionSchema.methods.calculateNextOrderDate = function () {
  const dayMap = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  const today = new Date();
  const targetDay = dayMap[this.frequency];
  const currentDay = today.getDay();

  let daysUntilNext = (targetDay + 7 - currentDay) % 7;
  if (daysUntilNext === 0) daysUntilNext = 7; // If today is the day, schedule for next week

  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysUntilNext);
  nextDate.setHours(0, 0, 0, 0);

  this.nextOrderDate = nextDate;
  return nextDate;
};

// Update after generating order
subscriptionSchema.methods.updateAfterOrderGeneration = async function () {
  this.lastOrderDate = new Date();
  this.ordersGenerated += 1;
  this.calculateNextOrderDate();
  await this.save();
};

const Subscription = mongoose.model("Subscription", subscriptionSchema);

module.exports = Subscription;
