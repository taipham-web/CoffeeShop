const express = require("express");
const router = express.Router();
const Branch = require("../models/Branch");
const checkAdmin = require("../middleware/checkAdmin");

// GET /branches/all (Admin or Public)
router.get("/all", async (req, res) => {
  try {
    const branches = await Branch.find().sort({ createdAt: -1 });
    res.json({ success: true, data: branches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /branches (Public - only active branches)
router.get("/", async (req, res) => {
  try {
    const branches = await Branch.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: branches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /branches (Admin only)
router.post("/", checkAdmin, async (req, res) => {
  try {
    const { name, address, phone, isActive } = req.body;
    if (!name || !address) {
      return res.status(400).json({ success: false, message: "Missing name or address" });
    }
    const branch = await Branch.create({ name, address, phone, isActive });
    res.status(201).json({ success: true, data: branch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /branches/:id (Admin only)
router.put("/:id", checkAdmin, async (req, res) => {
  try {
    const { name, address, phone, isActive } = req.body;
    const branch = await Branch.findByIdAndUpdate(
      req.params.id,
      { name, address, phone, isActive },
      { new: true }
    );
    if (!branch) {
      return res.status(404).json({ success: false, message: "Branch not found" });
    }
    res.json({ success: true, data: branch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /branches/:id (Admin only)
router.delete("/:id", checkAdmin, async (req, res) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch) {
      return res.status(404).json({ success: false, message: "Branch not found" });
    }
    res.json({ success: true, message: "Branch deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
