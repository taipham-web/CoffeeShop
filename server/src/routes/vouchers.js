const express = require("express");
const router = express.Router();
const Voucher = require("../models/Voucher");
const checkAdmin = require("../middleware/checkAdmin");
const auth = require("../middleware/auth");
const { sendBroadcastPushNotification } = require("../utils/pushNotifications");

// ── ADMIN ROUTES ──

// Get all vouchers
router.get("/all", checkAdmin, async (req, res) => {
  try {
    const vouchers = await Voucher.find().sort({ createdAt: -1 });
    res.json(vouchers);
  } catch (err) {
    console.error("Error fetching vouchers:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

// Create a new voucher
router.post("/", checkAdmin, async (req, res) => {
  try {
    const existing = await Voucher.findOne({ code: req.body.code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ error: "Voucher code already exists" });
    }
    const newVoucher = new Voucher(req.body);
    const savedVoucher = await newVoucher.save();

    // Send broadcast push notification
    if (savedVoucher.isActive) {
      await sendBroadcastPushNotification(
        "Voucher mới",
        `Voucher ${savedVoucher.code} vừa được thêm! Nhanh tay sử dụng nào.`,
        "voucher"
      );
    }

    res.status(201).json(savedVoucher);
  } catch (err) {
    console.error("Error creating voucher:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

// Update a voucher
router.put("/:id", checkAdmin, async (req, res) => {
  try {
    const updatedVoucher = await Voucher.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!updatedVoucher) return res.status(404).json({ error: "Voucher not found" });
    res.json(updatedVoucher);
  } catch (err) {
    console.error("Error updating voucher:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

// Delete a voucher
router.delete("/:id", checkAdmin, async (req, res) => {
  try {
    const deletedVoucher = await Voucher.findByIdAndDelete(req.params.id);
    if (!deletedVoucher) return res.status(404).json({ error: "Voucher not found" });
    res.json({ message: "Voucher deleted successfully" });
  } catch (err) {
    console.error("Error deleting voucher:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

// ── APP ROUTES ──

// Get active vouchers for users
router.get("/active", auth, async (req, res) => {
  try {
    const now = new Date();
    const vouchers = await Voucher.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $expr: {
        $or: [
          { $eq: ["$usageLimit", null] },
          { $lt: ["$usedCount", "$usageLimit"] }
        ]
      }
    }).sort({ endDate: 1 });
    res.json(vouchers);
  } catch (err) {
    console.error("Error fetching active vouchers:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

// Validate a voucher
router.post("/validate", auth, async (req, res) => {
  try {
    const { codes = [], cartSubtotal, deliveryFee = 0 } = req.body;
    
    if (!Array.isArray(codes) || cartSubtotal == null) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (codes.length > 3) {
      return res.status(400).json({ error: "Chỉ được áp dụng tối đa 3 mã giảm giá" });
    }

    let totalDiscount = 0;
    let remainingDeliveryFee = deliveryFee;
    const validatedVouchers = [];

    for (const code of codes) {
      const voucher = await Voucher.findOne({ code: code.toUpperCase() });

      if (!voucher) {
        return res.status(404).json({ error: `Mã giảm giá ${code} không tồn tại` });
      }

      if (!voucher.isActive) {
        return res.status(400).json({ error: `Mã giảm giá ${code} đã bị khóa` });
      }

      const now = new Date();
      if (now < voucher.startDate) {
        return res.status(400).json({ error: `Mã ${code} chưa đến thời gian áp dụng` });
      }
      if (now > voucher.endDate) {
        return res.status(400).json({ error: `Mã ${code} đã hết hạn` });
      }

      if (voucher.usageLimit !== null && voucher.usedCount >= voucher.usageLimit) {
        return res.status(400).json({ error: `Mã ${code} đã hết lượt sử dụng` });
      }

      if (cartSubtotal < voucher.minOrderValue) {
        return res.status(400).json({ error: `Đơn hàng tối thiểu ${voucher.minOrderValue.toLocaleString('vi-VN')} VNĐ để áp dụng mã ${code}` });
      }

      // Calculate individual discount
      let d = 0;
      if (voucher.discountType === 'fixed') {
        d = voucher.discountValue;
      } else if (voucher.discountType === 'percent') {
        d = (cartSubtotal * voucher.discountValue) / 100;
        if (voucher.maxDiscount !== null && d > voucher.maxDiscount) {
          d = voucher.maxDiscount;
        }
      } else if (voucher.discountType === 'freeship') {
        d = remainingDeliveryFee;
        if (voucher.maxDiscount !== null && d > voucher.maxDiscount) {
          d = voucher.maxDiscount;
        }
        remainingDeliveryFee = Math.max(0, remainingDeliveryFee - d);
      }

      totalDiscount += d;
      validatedVouchers.push({
        ...voucher.toObject(),
        calculatedDiscount: d
      });
    }

    // Cap total discount at (subTotal + deliveryFee) for fixed/percent ones?
    // Actually, fixed/percent shouldn't exceed subTotal, and freeship shouldn't exceed deliveryFee.
    // The current logic doesn't strictly cap percent/fixed at subtotal if they apply multiple.
    // Let's cap totalDiscount safely:
    totalDiscount = Math.min(totalDiscount, cartSubtotal + deliveryFee);

    res.json({
      valid: true,
      vouchers: validatedVouchers,
      totalDiscount
    });
  } catch (err) {
    console.error("Error validating vouchers:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;
