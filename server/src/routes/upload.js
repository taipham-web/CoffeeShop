const express = require("express");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { Readable } = require("stream");
const router = express.Router();

// Cấu hình Cloudinary từ .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer lưu trong RAM
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // Tối đa 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Chỉ chấp nhận file ảnh"));
  },
});

// Helper: upload buffer lên Cloudinary
function uploadToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "coffeeshop/avatars",
        transformation: [
          { width: 400, height: 400, crop: "fill", gravity: "face" },
          { quality: "auto", fetch_format: "auto" },
        ],
        ...options,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(stream);
  });
}

// POST /upload/avatar
router.post("/avatar", upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Không có file ảnh" });
    }

    // Kiểm tra Cloudinary đã cấu hình chưa
    if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === "your_cloud_name") {
      return res.status(500).json({
        success: false,
        message: "Cloudinary chưa được cấu hình. Vui lòng thêm CLOUDINARY_* vào server/.env",
      });
    }

    const result = await uploadToCloudinary(req.file.buffer, {
      public_id: `avatar_${Date.now()}`,
    });

    res.json({
      success: true,
      url: result.secure_url,      // HTTPS URL dùng luôn cho <Image>
      publicId: result.public_id,
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /upload/product
router.post("/product", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Không có file ảnh" });
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === "your_cloud_name") {
      return res.status(500).json({
        success: false,
        message: "Cloudinary chưa được cấu hình. Vui lòng thêm CLOUDINARY_* vào server/.env",
      });
    }

    const result = await uploadToCloudinary(req.file.buffer, {
      public_id: `product_${Date.now()}`,
      folder: "coffeeshop/products",
      transformation: [
        { width: 800, height: 800, crop: "fill" },
        { quality: "auto", fetch_format: "auto" },
      ],
    });

    res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
