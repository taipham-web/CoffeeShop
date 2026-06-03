const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

// GET /profile – Lấy thông tin profile
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });

    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        address: user.address,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /profile – Cập nhật thông tin profile
router.put("/", authMiddleware, async (req, res) => {
  try {
    const { name, phone, address, avatarUrl } = req.body;

    const updated = await User.findByIdAndUpdate(
      req.userId,
      {
        $set: {
          ...(name !== undefined && { name: name.trim() }),
          ...(phone !== undefined && { phone: phone.trim() }),
          ...(address !== undefined && { address: address.trim() }),
          ...(avatarUrl !== undefined && { avatarUrl }),
        },
      },
      { new: true, select: "-password" }
    );

    if (!updated) return res.status(404).json({ message: "User not found." });

    res.json({
      success: true,
      data: {
        id: updated._id,
        email: updated.email,
        name: updated.name,
        phone: updated.phone,
        address: updated.address,
        avatarUrl: updated.avatarUrl,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
