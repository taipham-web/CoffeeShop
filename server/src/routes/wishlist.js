const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

// GET /wishlist – Lấy danh sách sản phẩm yêu thích
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate("wishlist");
    if (!user) return res.status(404).json({ message: "User not found." });

    res.json({
      success: true,
      data: user.wishlist,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /wishlist/:id – Thêm sản phẩm vào yêu thích
router.post("/:id", authMiddleware, async (req, res) => {
  try {
    const productId = req.params.id;
    const user = await User.findById(req.userId);
    
    if (!user) return res.status(404).json({ message: "User not found." });

    if (!user.wishlist.includes(productId)) {
      user.wishlist.push(productId);
      await user.save();
    }

    // Populate để trả về mảng chi tiết
    await user.populate("wishlist");

    res.json({
      success: true,
      data: user.wishlist,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /wishlist/:id – Xoá sản phẩm khỏi yêu thích
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const productId = req.params.id;
    const user = await User.findById(req.userId);
    
    if (!user) return res.status(404).json({ message: "User not found." });

    user.wishlist = user.wishlist.filter(
      (id) => id.toString() !== productId
    );
    await user.save();

    await user.populate("wishlist");

    res.json({
      success: true,
      data: user.wishlist,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
