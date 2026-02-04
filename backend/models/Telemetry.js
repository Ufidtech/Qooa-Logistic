const mongoose = require("mongoose");

const telemetrySchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      ref: "Order",
    },
    truckId: {
      type: String,
      required: true,
      index: true,
    },
    temperature: {
      type: Number,
      required: true,
    },
    humidity: {
      type: Number,
      required: true,
    },
    gasLevel: {
      type: Number,
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: "2dsphere",
      },
    },
    locationName: String,
    batteryLevel: Number,
    recordedAt: {
      type: Date,
      required: true,
    },
    syncedAt: {
      type: Date,
      default: Date.now,
    },
    networkAvailable: {
      type: Boolean,
      default: true,
    },
    alerts: [
      {
        type: {
          type: String,
          enum: ["temperature", "gas", "humidity", "battery"],
        },
        severity: {
          type: String,
          enum: ["warning", "critical"],
        },
        message: String,
        triggeredAt: Date,
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Indexes
telemetrySchema.index({ truckId: 1, recordedAt: -1 });
telemetrySchema.index({ orderId: 1 });
telemetrySchema.index({ recordedAt: -1 });

// Check and add alerts based on thresholds
telemetrySchema.methods.checkAlerts = function () {
  this.alerts = [];

  // Temperature alerts
  if (this.temperature > 30) {
    this.alerts.push({
      type: "temperature",
      severity: "critical",
      message: `Temperature critically high: ${this.temperature}°C`,
      triggeredAt: new Date(),
    });
  } else if (this.temperature > 28) {
    this.alerts.push({
      type: "temperature",
      severity: "warning",
      message: `Temperature elevated: ${this.temperature}°C`,
      triggeredAt: new Date(),
    });
  }

  // Gas level alerts
  if (this.gasLevel > 100) {
    this.alerts.push({
      type: "gas",
      severity: "critical",
      message: `Gas level critical (fermentation): ${this.gasLevel} ppm`,
      triggeredAt: new Date(),
    });
  } else if (this.gasLevel > 80) {
    this.alerts.push({
      type: "gas",
      severity: "warning",
      message: `Gas level elevated: ${this.gasLevel} ppm`,
      triggeredAt: new Date(),
    });
  }

  // Battery alerts
  if (this.batteryLevel && this.batteryLevel < 20) {
    this.alerts.push({
      type: "battery",
      severity: "warning",
      message: `Battery low: ${this.batteryLevel}%`,
      triggeredAt: new Date(),
    });
  }

  return this.alerts;
};

// Calculate telemetry summary for an order
telemetrySchema.statics.getOrderSummary = async function (orderId) {
  const telemetryData = await this.find({ orderId }).sort({ recordedAt: 1 });

  if (telemetryData.length === 0) return null;

  const temps = telemetryData.map((t) => t.temperature);
  const humidity = telemetryData.map((t) => t.humidity);
  const gas = telemetryData.map((t) => t.gasLevel);

  const firstReading = telemetryData[0];
  const lastReading = telemetryData[telemetryData.length - 1];
  const transitDuration =
    (lastReading.recordedAt - firstReading.recordedAt) / 1000; // seconds

  return {
    avgTemp: parseFloat(
      (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1),
    ),
    maxTemp: Math.max(...temps),
    minTemp: Math.min(...temps),
    avgHumidity: parseFloat(
      (humidity.reduce((a, b) => a + b, 0) / humidity.length).toFixed(1),
    ),
    maxGasLevel: Math.max(...gas),
    transitDuration,
    dataPoints: telemetryData.length,
    route: {
      start: firstReading.locationName || "Unknown",
      end: lastReading.locationName || "Unknown",
    },
  };
};

const Telemetry = mongoose.model("Telemetry", telemetrySchema);

module.exports = Telemetry;
