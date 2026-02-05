const Vendor = require("../models/VendorRegistration");
const { generateToken } = require("../middleware/authMiddleware");
const {
  generateVerificationToken,
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require("../utils/emailService");
const whatsappService = require("../utils/whatsappService");
const { asyncHandler } = require("../middleware/errorMiddleware");
const crypto = require("crypto");

// @desc    Register new vendor
// @route   POST /api/auth/register
// @access  Public
const registerVendor = asyncHandler(async (req, res) => {
  const {
    vendorName,
    phoneNumber,
    whatsappNumber,
    email,
    password,
    marketCluster,
    stallNumber,
    businessType,
    language,
  } = req.body;

  // Normalize phone numbers to common E.164 form for storage/lookup
  const { normalizeToE164, lookupVariants } = require('../utils/phoneUtils');
  const normalizedPhone = normalizeToE164(phoneNumber);
  const normalizedWhatsapp = normalizeToE164(whatsappNumber || phoneNumber);

  // Check if vendor already exists
  // Accept multiple lookup variants (0813..., +234813..., 813...)
  const phoneVariants = lookupVariants(phoneNumber);
  const vendorExists = await Vendor.findOne({
    $or: [{ phoneNumber: { $in: phoneVariants } }, { email }],
  });

  if (vendorExists) {
    return res.status(400).json({
      success: false,
      message:
        vendorExists.phoneNumber === phoneNumber
          ? "Phone number already registered"
          : "Email already registered",
    });
  }

  // Generate email verification token
  const verificationToken = generateVerificationToken();
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Create vendor
  const vendor = await Vendor.create({
    vendorId: Vendor.generateVendorId(),
    vendorName,
    phoneNumber: normalizedPhone,
    whatsappNumber: normalizedWhatsapp,
    email,
    password, // Will be hashed by pre-save hook
    marketCluster,
    stallNumber,
    businessType,
    language: language || "en",
    emailVerificationToken: verificationToken,
    emailVerificationExpires: verificationExpires,
  });

  if (vendor) {
    // Send verification email
    try {
      await sendVerificationEmail(vendor, verificationToken);
    } catch (error) {
      console.error("Error sending verification email:", error);
    }

    // Send WhatsApp welcome message
    try {
      await whatsappService.sendWelcomeMessage(vendor);
    } catch (error) {
      console.error("Error sending WhatsApp welcome:", error);
    }

    // Generate JWT token
    const token = generateToken(vendor._id);

    res.status(201).json({
      success: true,
      message:
        "Vendor registered successfully. Please check your email to verify your account.",
      vendor: {
        id: vendor._id,
        vendorId: vendor.vendorId,
        vendorName: vendor.vendorName,
        phoneNumber: vendor.phoneNumber,
          whatsappNumber: vendor.whatsappNumber,
        email: vendor.email,
        emailVerified: vendor.emailVerified,
        marketCluster: vendor.marketCluster,
        stallNumber: vendor.stallNumber,
        businessType: vendor.businessType,
        language: vendor.language,
        status: vendor.status,
      },
      token,
    });
  } else {
    res.status(400).json({
      success: false,
      message: "Invalid vendor data",
    });
  }
});

// @desc    Login vendor
// @route   POST /api/auth/login
// @access  Public
const loginVendor = asyncHandler(async (req, res) => {
  const { phoneNumber: rawPhone, password } = req.body;
  const { normalizeToE164, lookupVariants } = require('../utils/phoneUtils');
  const phoneVariants = lookupVariants(rawPhone);

  // Find vendor and include password field. Accept variants (0-prefixed, +234, local)
  const vendor = await Vendor.findOne({ phoneNumber: { $in: phoneVariants } }).select("+password");

  if (!vendor) {
    return res.status(401).json({
      success: false,
      message: "Invalid phone number or password",
    });
  }

  // Check password
  const isPasswordValid = await vendor.comparePassword(password);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: "Invalid phone number or password",
    });
  }

  // Check if vendor is active
  if (vendor.status !== "active") {
    return res.status(403).json({
      success: false,
      message: "Your account is not active. Please contact support.",
    });
  }

  // Generate token
  const token = generateToken(vendor._id);

  // Update last login
  vendor.lastLoginAt = new Date();
  await vendor.save({ validateBeforeSave: false });

  res.json({
    success: true,
    message: "Login successful",
    vendor: {
      id: vendor._id,
      vendorId: vendor.vendorId,
      vendorName: vendor.vendorName,
      phoneNumber: vendor.phoneNumber,
      whatsappNumber: vendor.whatsappNumber,
      email: vendor.email,
      emailVerified: vendor.emailVerified,
      marketCluster: vendor.marketCluster,
      stallNumber: vendor.stallNumber,
      businessType: vendor.businessType,
      language: vendor.language,
      qualityScore: vendor.qualityScore,
      totalOrders: vendor.totalOrders,
      totalSpent: vendor.totalSpent,
      status: vendor.status,
    },
    token,
  });
});

// @desc    Verify email
// @route   GET /api/auth/verify-email
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  const { token, email } = req.query;

  if (!token || !email) {
    // If the request expects JSON, return JSON; otherwise redirect to frontend with status
    const frontendBase = process.env.FRONTEND_URL || process.env.BASE_URL || '';
    const wantsJson = req.headers.accept && req.headers.accept.indexOf('application/json') !== -1;
    if (wantsJson) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification link',
      });
    }

    const redirectUrl = `${frontendBase.replace(/\/$/, '')}/verify-email.html?status=failed&message=${encodeURIComponent('Invalid verification link')}`;
    return res.redirect(302, redirectUrl);
  }

  // Find vendor with valid token
  const vendor = await Vendor.findOne({
    email,
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!vendor) {
    const frontendBase = process.env.FRONTEND_URL || process.env.BASE_URL || '';
    const wantsJson = req.headers.accept && req.headers.accept.indexOf('application/json') !== -1;
    if (wantsJson) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
      });
    }

    const redirectUrl = `${frontendBase.replace(/\/$/, '')}/verify-email.html?status=failed&message=${encodeURIComponent('Invalid or expired verification token')}`;
    return res.redirect(302, redirectUrl);
  }

  // Update vendor
  vendor.emailVerified = true;
  vendor.emailVerificationToken = undefined;
  vendor.emailVerificationExpires = undefined;
  await vendor.save();
  // On success, redirect to frontend verify page with success status (or return JSON if requested)
  const frontendBase = process.env.FRONTEND_URL || process.env.BASE_URL || '';
  const wantsJson = req.headers.accept && req.headers.accept.indexOf('application/json') !== -1;
  if (wantsJson) {
    return res.json({
      success: true,
      message: 'Email verified successfully! You can now access all features.',
    });
  }

  const redirectUrl = `${frontendBase.replace(/\/$/, '')}/verify-email.html?status=success&email=${encodeURIComponent(email)}`;
  return res.redirect(302, redirectUrl);
});

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const vendor = await Vendor.findOne({ email });

  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: "Vendor not found",
    });
  }

  if (vendor.emailVerified) {
    return res.status(400).json({
      success: false,
      message: "Email already verified",
    });
  }

  // Generate new token
  const verificationToken = generateVerificationToken();
  vendor.emailVerificationToken = verificationToken;
  vendor.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await vendor.save();

  // Send email
  await sendVerificationEmail(vendor, verificationToken);

  res.json({
    success: true,
    message: "Verification email sent. Please check your inbox.",
  });
});

// @desc    Get vendor profile
// @route   GET /api/vendors/profile
// @access  Private
const getVendorProfile = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.vendor._id)
    .populate("orders")
    .populate("subscriptions");

  res.json({
    success: true,
    vendor: {
      id: vendor._id,
      vendorId: vendor.vendorId,
      vendorName: vendor.vendorName,
      phoneNumber: vendor.phoneNumber,
      whatsappNumber: vendor.whatsappNumber,
      email: vendor.email,
      emailVerified: vendor.emailVerified,
      marketCluster: vendor.marketCluster,
      stallNumber: vendor.stallNumber,
      businessType: vendor.businessType,
      language: vendor.language,
      qualityScore: vendor.qualityScore,
      totalOrders: vendor.totalOrders,
      totalSpent: vendor.totalSpent,
      status: vendor.status,
      createdAt: vendor.createdAt,
      lastLoginAt: vendor.lastLoginAt,
    },
  });
});

// @desc    Update vendor profile
// @route   PUT /api/vendors/profile
// @access  Private
const updateVendorProfile = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.vendor._id);

  if (vendor) {
    // Only allow certain fields to be updated
    vendor.vendorName = req.body.vendorName || vendor.vendorName;
    vendor.stallNumber = req.body.stallNumber || vendor.stallNumber;
    vendor.whatsappNumber = req.body.whatsappNumber || vendor.whatsappNumber;
    vendor.language = req.body.language || vendor.language;

    // If updating email, require re-verification
    if (req.body.email && req.body.email !== vendor.email) {
      vendor.email = req.body.email;
      vendor.emailVerified = false;

      const verificationToken = generateVerificationToken();
      vendor.emailVerificationToken = verificationToken;
      vendor.emailVerificationExpires = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      );

      await sendVerificationEmail(vendor, verificationToken);
    }

    const updatedVendor = await vendor.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      vendor: {
        id: updatedVendor._id,
        vendorId: updatedVendor.vendorId,
        vendorName: updatedVendor.vendorName,
        phoneNumber: updatedVendor.phoneNumber,
        whatsappNumber: updatedVendor.whatsappNumber,
        email: updatedVendor.email,
        emailVerified: updatedVendor.emailVerified,
        marketCluster: updatedVendor.marketCluster,
        stallNumber: updatedVendor.stallNumber,
        businessType: updatedVendor.businessType,
        language: updatedVendor.language,
      },
    });
  } else {
    res.status(404).json({
      success: false,
      message: "Vendor not found",
    });
  }
});

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const vendor = await Vendor.findOne({ email });

  if (!vendor) {
    return res.status(404).json({
      success: false,
      message: "Vendor not found with this email",
    });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  vendor.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  vendor.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await vendor.save({ validateBeforeSave: false });

  // Send email
  try {
    await sendPasswordResetEmail(vendor, resetToken);

    res.json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (error) {
    vendor.resetPasswordToken = undefined;
    vendor.resetPasswordExpires = undefined;
    await vendor.save({ validateBeforeSave: false });

    return res.status(500).json({
      success: false,
      message: "Error sending password reset email",
    });
  }
});

// @desc    Show reset password page / validate reset token
// @route   GET /api/auth/reset-password
// @access  Public
const getResetPassword = asyncHandler(async (req, res) => {
  const { token, email } = req.query;

  const frontendBase = process.env.FRONTEND_URL || process.env.BASE_URL || '';
  const wantsJson = req.headers.accept && req.headers.accept.indexOf('application/json') !== -1;

  if (!token || !email) {
    if (wantsJson) {
      return res.status(400).json({ success: false, message: 'Invalid reset link' });
    }
    const redirectUrl = `${frontendBase.replace(/\/$/, '')}/resetpassword.html?status=failed&message=${encodeURIComponent('Invalid reset link')}`;
    return res.redirect(302, redirectUrl);
  }

  // Verify token
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const vendor = await Vendor.findOne({
    email,
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!vendor) {
    if (wantsJson) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }
    const redirectUrl = `${frontendBase.replace(/\/$/, '')}/resetpassword.html?status=failed&message=${encodeURIComponent('Invalid or expired reset token')}`;
    return res.redirect(302, redirectUrl);
  }

  // Token valid — redirect to frontend reset page with token (frontend will POST to complete reset)
  if (wantsJson) {
    return res.json({ success: true, message: 'Reset token valid' });
  }

  const redirectUrl = `${frontendBase.replace(/\/$/, '')}/resetpassword.html?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  return res.redirect(302, redirectUrl);
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { token, email, newPassword } = req.body;

  // Hash the token from URL
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const vendor = await Vendor.findOne({
    email,
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!vendor) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired reset token",
    });
  }

  // Set new password
  vendor.password = newPassword;
  vendor.resetPasswordToken = undefined;
  vendor.resetPasswordExpires = undefined;
  await vendor.save();

  res.json({
    success: true,
    message:
      "Password reset successful. You can now login with your new password.",
  });
});

module.exports = {
  registerVendor,
  loginVendor,
  verifyEmail,
  resendVerificationEmail,
  getVendorProfile,
  updateVendorProfile,
  forgotPassword,
  resetPassword,
  getResetPassword,
};
