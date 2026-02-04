const express = require("express");
const router = express.Router();
const {
  getVendorProfile,
  updateVendorProfile,
} = require("../controllers/vendorController");
const { protect } = require("../middleware/authMiddleware");

// All routes are protected
router.use(protect);

// @route   GET /api/vendors/profile
router.get("/profile", getVendorProfile);

// @route   PUT /api/vendors/profile
router.put("/profile", updateVendorProfile);

module.exports = router;
