const { body, param, query, validationResult } = require("express-validator");

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

// Vendor registration validation
const validateRegister = [
  body("vendorName")
    .trim()
    .notEmpty()
    .withMessage("Vendor name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Vendor name must be between 2 and 100 characters"),

  body("phoneNumber")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^(\+?234|0)[789][01]\d{8}$/)
    .withMessage("Invalid Nigerian phone number"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain uppercase, lowercase, and number"),

  body("marketCluster")
    .trim()
    .notEmpty()
    .withMessage("Market cluster is required")
    .isIn(["Oshodi", "Mile 12", "Oyingbo", "Ikeja", "Mushin", "Other"])
    .withMessage("Invalid market cluster"),

  body("stallNumber")
    .trim()
    .notEmpty()
    .withMessage("Stall number is required")
    .isLength({ max: 50 })
    .withMessage("Stall number too long"),

  body("businessType")
    .trim()
    .notEmpty()
    .withMessage("Business type is required")
    .isIn([
      "mama-put",
      "restaurant",
      "catering",
      "hotel",
      "canteen",
      "fast-food",
      "other",
    ])
    .withMessage("Invalid business type"),

  handleValidationErrors,
];

// Login validation
const validateLogin = [
  body("phoneNumber").trim().notEmpty().withMessage("Phone number is required"),

  body("password").notEmpty().withMessage("Password is required"),

  handleValidationErrors,
];

// Order creation validation
const validateCreateOrder = [
  body("crateQuantity")
    .notEmpty()
    .withMessage("Crate quantity is required")
    .isInt({ min: 1, max: 100 })
    .withMessage("Crate quantity must be between 1 and 100"),

  body("deliveryDate")
    .notEmpty()
    .withMessage("Delivery date is required")
    .isISO8601()
    .withMessage("Invalid date format")
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        throw new Error("Delivery date cannot be in the past");
      }
      return true;
    }),

  body("deliveryTime")
    .notEmpty()
    .withMessage("Delivery time is required")
    .isIn(["morning", "midday", "afternoon"])
    .withMessage("Invalid delivery time"),

  handleValidationErrors,
];

// Subscription creation validation
const validateCreateSubscription = [
  body("crateQuantity")
    .notEmpty()
    .withMessage("Crate quantity is required")
    .isInt({ min: 1, max: 50 })
    .withMessage("Crate quantity must be between 1 and 50"),

  body("frequency")
    .notEmpty()
    .withMessage("Frequency is required")
    .isIn(["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"])
    .withMessage("Invalid frequency"),

  body("deliveryTime")
    .notEmpty()
    .withMessage("Delivery time is required")
    .isIn(["morning", "midday", "afternoon"])
    .withMessage("Invalid delivery time"),

  handleValidationErrors,
];

// Feedback submission validation
const validateFeedback = [
  body("orderId").notEmpty().withMessage("Order ID is required"),

  body("rating")
    .notEmpty()
    .withMessage("Rating is required")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  body("comments")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Comments must not exceed 500 characters"),

  body("hasDamageReport")
    .optional()
    .isBoolean()
    .withMessage("hasDamageReport must be boolean"),

  handleValidationErrors,
];

// Telemetry data validation
const validateTelemetry = [
  body("orderId").notEmpty().withMessage("Order ID is required"),

  body("truckId").notEmpty().withMessage("Truck ID is required"),

  body("temperature")
    .notEmpty()
    .withMessage("Temperature is required")
    .isFloat({ min: -10, max: 50 })
    .withMessage("Temperature must be between -10 and 50°C"),

  body("humidity")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Humidity must be between 0 and 100%"),

  body("gasLevel")
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage("Gas level must be between 0 and 1000 ppm"),

  body("location")
    .optional()
    .isObject()
    .withMessage("Location must be an object"),

  body("location.latitude")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Invalid latitude"),

  body("location.longitude")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Invalid longitude"),

  handleValidationErrors,
];

// Broadcast message validation
const validateBroadcast = [
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ max: 1000 })
    .withMessage("Message must not exceed 1000 characters"),

  body("messagePidgin")
    .trim()
    .notEmpty()
    .withMessage("Pidgin message is required")
    .isLength({ max: 1000 })
    .withMessage("Pidgin message must not exceed 1000 characters"),

  body("sentVia")
    .notEmpty()
    .withMessage("sentVia is required")
    .isIn(["whatsapp", "email", "both"])
    .withMessage("sentVia must be whatsapp, email, or both"),

  body("targetMarket").optional().trim(),

  handleValidationErrors,
];

// Pricing update validation
const validatePricing = [
  body("pricePerCrate")
    .notEmpty()
    .withMessage("Price per crate is required")
    .isFloat({ min: 100, max: 100000 })
    .withMessage("Price must be between ₦100 and ₦100,000"),

  body("effectiveFrom")
    .optional()
    .isISO8601()
    .withMessage("Invalid date format"),

  body("marketFactor")
    .optional()
    .isFloat({ min: 0.5, max: 2.0 })
    .withMessage("Market factor must be between 0.5 and 2.0"),

  body("trend")
    .optional()
    .isIn(["up", "down", "stable"])
    .withMessage("Trend must be up, down, or stable"),

  handleValidationErrors,
];

// Order ID parameter validation
const validateOrderId = [
  param("orderId")
    .notEmpty()
    .withMessage("Order ID is required")
    .matches(/^ORD-\d{8}-[A-Z0-9]{6}$/)
    .withMessage("Invalid order ID format"),

  handleValidationErrors,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateCreateOrder,
  validateCreateSubscription,
  validateFeedback,
  validateTelemetry,
  validateBroadcast,
  validatePricing,
  validateOrderId,
  handleValidationErrors,
};
