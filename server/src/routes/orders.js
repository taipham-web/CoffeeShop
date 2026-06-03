const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const auth = require("../middleware/auth"); // Assuming an auth middleware exists
const { sendPushNotification } = require("../utils/pushNotifications");

// Create a new order
router.post("/", auth, async (req, res) => {
  try {
    const {
      items,
      orderType,
      deliveryAddress,
      discountApplied,
      subTotal,
      deliveryFee,
      totalPayment,
      paymentMethod,
      voucherIds = [],
    } = req.body;

    let finalTotalPayment = subTotal + deliveryFee;
    let totalDiscount = 0;
    let remainingDeliveryFee = deliveryFee;
    const appliedVoucherIds = [];

    if (Array.isArray(voucherIds) && voucherIds.length > 0) {
      const Voucher = require("../models/Voucher");
      
      for (const vid of voucherIds) {
        const voucher = await Voucher.findById(vid);
        if (voucher && voucher.isActive) {
          const now = new Date();
          if (now >= voucher.startDate && now <= voucher.endDate) {
            if (voucher.usageLimit === null || voucher.usedCount < voucher.usageLimit) {
              if (subTotal >= voucher.minOrderValue) {
                // Apply discount
                let d = 0;
                if (voucher.discountType === 'fixed') {
                  d = voucher.discountValue;
                } else if (voucher.discountType === 'percent') {
                  d = (subTotal * voucher.discountValue) / 100;
                  if (voucher.maxDiscount !== null && d > voucher.maxDiscount) d = voucher.maxDiscount;
                } else if (voucher.discountType === 'freeship') {
                  d = remainingDeliveryFee;
                  if (voucher.maxDiscount !== null && d > voucher.maxDiscount) d = voucher.maxDiscount;
                  remainingDeliveryFee = Math.max(0, remainingDeliveryFee - d);
                }

                totalDiscount += d;
                
                // Increment used count
                voucher.usedCount += 1;
                await voucher.save();
                appliedVoucherIds.push(vid);
              }
            }
          }
        }
      }
      
      // Calculate final
      totalDiscount = Math.min(totalDiscount, subTotal + deliveryFee);
      finalTotalPayment = Math.max(0, subTotal + deliveryFee - totalDiscount);
    }

    const newOrder = new Order({
      user: req.userId,
      items,
      orderType,
      deliveryAddress,
      discountApplied,
      subTotal,
      deliveryFee,
      totalPayment: finalTotalPayment,
      paymentMethod,
      voucherIds: appliedVoucherIds,
    });

    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

// Get user's orders
router.get("/my-orders", auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

// Cancel user's pending order
router.put("/:id/cancel", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Đơn hàng không tồn tại" });

    // ensure user owns this order
    if (order.user.toString() !== req.userId) {
      return res.status(403).json({ error: "Bạn không có quyền thực hiện thao tác này" });
    }

    if (order.status !== "pending") {
      return res.status(400).json({ error: "Chỉ có thể hủy đơn hàng đang chờ xác nhận" });
    }

    order.status = "cancelled";
    await order.save();

    res.json({ message: "Hủy đơn hàng thành công", order });
  } catch (err) {
    console.error("Error cancelling order:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

// ── ADMIN ROUTES ──
const checkAdmin = require("../middleware/checkAdmin");

// Get all orders (Admin only)
router.get("/all", checkAdmin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email phone")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("Error fetching all orders:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

// Update order status (Admin only)
router.put("/:id/status", checkAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "processing", "delivering", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    let order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (order.status === "cancelled") {
      return res.status(400).json({ error: "Không thể thay đổi trạng thái của đơn hàng đã bị hủy" });
    }

    order.status = status;
    await order.save();

    // Populate user info before returning
    order = await Order.findById(order._id).populate("user", "name email phone");

    // Send push notification to user
    const statusMessages = {
      processing: "Đơn hàng của bạn đang được chuẩn bị.",
      delivering: "Đơn hàng của bạn đang được giao đến.",
      completed: "Đơn hàng của bạn đã hoàn tất. Cảm ơn bạn!",
      cancelled: "Đơn hàng của bạn đã bị hủy.",
    };
    if (statusMessages[status]) {
      await sendPushNotification(
        order.user._id,
        "Cập nhật đơn hàng",
        statusMessages[status],
        "order"
      );
    }
    
    res.json(order);
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

// Get order by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // ensure user owns this order
    if (order.user.toString() !== req.userId) {
      return res.status(403).json({ error: "Not authorized to view this order" });
    }

    res.json(order);
  } catch (err) {
    console.error("Error fetching order:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;
