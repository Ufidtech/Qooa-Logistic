const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { Readable } = require("stream");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage for multer
const storage = multer.memoryStorage();

// Create Multer upload middleware
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 5, // Maximum 5 files per upload
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || "qooa-damage-reports",
        transformation: options.transformation || [
          { width: 1200, height: 1200, crop: "limit" },
          { quality: "auto" },
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );

    Readable.from(buffer).pipe(uploadStream);
  });
};

// Middleware to upload single image
const uploadSingle = upload.single("image");

// Middleware to upload multiple images
const uploadMultiple = upload.array("images", 5);

// Delete image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`Image deleted from Cloudinary: ${publicId}`);
    return result;
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    throw error;
  }
};

// Delete multiple images
const deleteMultipleImages = async (publicIds) => {
  try {
    const result = await cloudinary.api.delete_resources(publicIds);
    console.log(`${publicIds.length} images deleted from Cloudinary`);
    return result;
  } catch (error) {
    console.error("Error deleting multiple images:", error);
    throw error;
  }
};

// Get image URL with transformations
const getImageUrl = (publicId, transformation = {}) => {
  return cloudinary.url(publicId, {
    transformation: transformation,
    secure: true,
  });
};

// Get optimized thumbnail URL
const getThumbnailUrl = (publicId) => {
  return cloudinary.url(publicId, {
    transformation: [
      { width: 300, height: 300, crop: "fill" },
      { quality: "auto", fetch_format: "auto" },
    ],
    secure: true,
  });
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadToCloudinary,
  deleteImage,
  deleteMultipleImages,
  getImageUrl,
  getThumbnailUrl,
  cloudinary,
};
