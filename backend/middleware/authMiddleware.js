const jwt = require("jsonwebtoken");
const Vendor = require("../models/Vendor");

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get vendor from token
      req.vendor = await Vendor.findById(decoded.id).select("-password");

      if (!req.vendor) {
        return res.status(401).json({
          success: false,
          message: "Not authorized - vendor not found",
        });
      }

      // Check if vendor is active
      if (req.vendor.status !== "active") {
        return res.status(403).json({
          success: false,
          message: "Account is not active. Please contact support.",
        });
      }

      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      return res.status(401).json({
        success: false,
        message: "Not authorized - invalid token",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized - no token provided",
    });
  }
};

// Check if email is verified
const requireEmailVerified = (req, res, next) => {
  if (!req.vendor.emailVerified) {
    return res.status(403).json({
      success: false,
      message: "Please verify your email address to access this feature",
    });
  }
  next();
};

// Admin middleware (for future admin features)
const requireAdmin = (req, res, next) => {
  if (req.vendor.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied - admin only",
    });
  }
  next();
};

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

module.exports = {
  protect,
  requireEmailVerified,
  requireAdmin,
  generateToken,
};
