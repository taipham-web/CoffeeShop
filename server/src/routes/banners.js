const express = require("express");
const router = express.Router();
const Banner = require("../models/Banner");
const checkAdmin = require("../middleware/checkAdmin");

// GET /banners - Public API
router.get("/", async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /banners/all - Admin API
router.get("/all", checkAdmin, async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });
    res.json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /banners - Admin API
router.post("/", checkAdmin, async (req, res) => {
  try {
    const { title, imageUrl, isActive } = req.body;
    if (!title || !imageUrl) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    const banner = await Banner.create({ title, imageUrl, isActive });
    res.status(201).json({ success: true, data: banner });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT /banners/:id - Admin API
router.put("/:id", checkAdmin, async (req, res) => {
  try {
    const { title, imageUrl, isActive } = req.body;
    const banner = await Banner.findByIdAndUpdate(
      req.params.id,
      { title, imageUrl, isActive },
      { new: true }
    );
    if (!banner) return res.status(404).json({ success: false, message: "Banner not found" });
    res.json({ success: true, data: banner });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE /banners/:id - Admin API
router.delete("/:id", checkAdmin, async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: "Banner not found" });
    res.json({ success: true, message: "Banner deleted successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router;
