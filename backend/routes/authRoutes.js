const express = require("express");
const router = express.Router();
const {
  registerVendor,
  loginVendor,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  getResetPassword,
} = require("../controllers/vendorController");
const {
  validateRegister,
  validateLogin,
} = require("../middleware/validateMiddleware");

// @route   POST /api/auth/register
router.post("/register", validateRegister, registerVendor);

// @route   POST /api/auth/login
router.post("/login", validateLogin, loginVendor);

// @route   GET /api/auth/verify-email
router.get("/verify-email", verifyEmail);

// @route   POST /api/auth/resend-verification
router.post("/resend-verification", resendVerificationEmail);

// @route   POST /api/auth/forgot-password
router.post("/forgot-password", forgotPassword);

// @route   POST /api/auth/reset-password
router.post("/reset-password", resetPassword);

// @route   GET /api/auth/reset-password
router.get("/reset-password", getResetPassword);

module.exports = router;
