const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const Notification = require("../models/Notification");

// POST /api/notifications/token - Update Expo Push Token
router.post("/token", auth, async (req, res) => {
  try {
    const { expoPushToken } = req.body;
    if (!expoPushToken) {
      return res.status(400).json({ message: "expoPushToken is required" });
    }

    await User.findByIdAndUpdate(req.userId, { expoPushToken });
    res.json({ message: "Token updated successfully" });
  } catch (error) {
    console.error("Error updating push token:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/notifications - Get list of notifications
router.get("/", auth, async (req, res) => {
  try {
    // Get user-specific notifications or global notifications
    const notifications = await Notification.find({
      $or: [{ userId: req.userId }, { userId: null }]
    })
      .sort({ createdAt: -1 })
      .limit(50); // Fetch latest 50 notifications
    
    res.json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put("/:id/read", auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    
    // Only update if it belongs to user or is global
    if (notification.userId && notification.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ message: "Notification marked as read", notification });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
