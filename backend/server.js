// QOOA Backend API - MongoDB Express Server
require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const http = require("http");
const socketIO = require("socket.io");

// Database
const connectDB = require("./config/database");

// Middleware
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

// Routes
const authRoutes = require("./routes/authRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const orderRoutes = require("./routes/orderRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const pricingRoutes = require("./routes/pricingRoutes");
const broadcastRoutes = require("./routes/broadcastRoutes");
const telemetryRoutes = require("./routes/telemetryRoutes");

// Initialize app
const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// ========== MIDDLEWARE ==========

// Security
app.use(helmet());

// CORS configuration
// Allow the configured FRONTEND_URL, some common local dev origins and
// requests without an origin (file:// or some dev servers that set null).
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:8080").split(",");
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g. file:// or some tools)
    if (!origin) return callback(null, true);

    // Allow if origin is in allowedOrigins or matches common local ports
    if (allowedOrigins.indexOf(origin) !== -1 || [
      'http://localhost:8000',
      'http://localhost:8080',
      'http://localhost:3000',
    ].includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Compression
app.use(compression());

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Rate limiting
const limiter = rateLimit({
  windowMs:
    parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// ========== SOCKET.IO FOR REAL-TIME TRACKING ==========

const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:8000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Join order tracking room
  socket.on("trackOrder", (orderId) => {
    socket.join(`order-${orderId}`);
    console.log(`Client joined tracking for order ${orderId}`);
  });

  // Leave order tracking room
  socket.on("untrackOrder", (orderId) => {
    socket.leave(`order-${orderId}`);
    console.log(`Client left tracking for order ${orderId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Make io accessible in routes
app.set("io", io);

// Serve frontend static files from the repository's frontend/ directory
// This makes the app serve HTML/CSS/JS on the same origin (http://localhost:3000)
// so the browser won't hit CORS issues during development.
const frontendDir = path.join(__dirname, "..", "frontend");
app.use(express.static(frontendDir));

// If a file is not found, fall back to index.html for client-side routing (optional)
app.get(["/", "/vendor-onboarding.html", "/login.html", "/signup.html", "/forgot-password.html", "/resetpassword.html"], (req, res) => {
  res.sendFile(path.join(frontendDir, req.path === "/" ? "index.html" : req.path.replace(/^\//, "")));
});

// ========== API ROUTES ==========

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "QOOA API Server - MongoDB Version",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Serve the single-file frontend for quick local demo
app.get("/single-frontend", (req, res) => {
  const filePath = path.join(__dirname, "..", "frontend", "index.html");
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Failed to send frontend/index.html:", err);
      res.status(500).send("Unable to load frontend file.");
    }
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    database: "connected",
    email: app.locals.emailStatus || "unknown",
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/pricing", pricingRoutes);
app.use("/api/broadcast", broadcastRoutes);
app.use("/api/telemetry", telemetryRoutes);

// ========== ERROR HANDLING ==========

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// ========== HELPER FUNCTION: EMIT TRACKING UPDATES ==========

// Function to emit real-time order tracking updates
function emitTrackingUpdate(orderId, trackingData) {
  const io = app.get("io");
  if (io) {
    io.to(`order-${orderId}`).emit("trackingUpdate", trackingData);
  }
}

// Make emitTrackingUpdate available globally
global.emitTrackingUpdate = emitTrackingUpdate;

// ========== EMAIL READINESS CHECK =========
const { verifyTransporter } = require("./utils/emailService");

// Initialize email status as unknown. We'll check on server start.
app.locals.emailStatus = "unknown";

// ========== START SERVER =========

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("=".repeat(50));
  console.log("🍅 QOOA Backend Server - MongoDB Version");
  console.log("=".repeat(50));

  // Check email transporter readiness and log it
  (async () => {
    try {
      const result = await verifyTransporter();
      if (result.ok) {
        app.locals.emailStatus = "ready";
        console.log("📧 Email transporter: ready to send");
      } else {
        app.locals.emailStatus = `error: ${result.error}`;
        console.warn("⚠️ Email transporter not ready:", result.error);
      }
    } catch (err) {
      app.locals.emailStatus = `error: ${err.message || err}`;
      console.warn("⚠️ Email transporter check failed:", err);
    }
  })();
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
  console.log(`💻 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📡 Socket.IO enabled for real-time tracking`);
  console.log("=".repeat(50));
  console.log("📝 API Endpoints:");
  console.log("  - POST /api/auth/register");
  console.log("  - POST /api/auth/login");
  console.log("  - GET  /api/auth/verify-email");
  console.log("  - GET  /api/vendors/profile");
  console.log("  - POST /api/orders/create");
  console.log("  - GET  /api/orders/vendor");
  console.log("  - POST /api/subscriptions/create");
  console.log("  - POST /api/feedback/submit");
  console.log("  - GET  /api/pricing/current");
  console.log("  - POST /api/telemetry/data");
  console.log("=".repeat(50));
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Promise Rejection:", err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = app;
