const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");
const User = require("../models/User");
const auth = require("../middleware/auth");
const checkAdmin = require("../middleware/checkAdmin");
const mongoose = require("mongoose");

// Get list of users who have chatted (Admin only)
router.get("/users", auth, checkAdmin, async (req, res) => {
  try {
    // Find all distinct users from Chat collection
    const userIds = await Chat.distinct("user");
    
    // Get user details
    const users = await User.find({ _id: { $in: userIds } }).select("-password");
    
    // Attach latest message for each user
    const usersWithLatestMessage = await Promise.all(
      users.map(async (user) => {
        const latestMessage = await Chat.findOne({ user: user._id })
          .sort({ createdAt: -1 })
          .limit(1);
          
        const unreadCount = await Chat.countDocuments({
          user: user._id,
          sender: "user",
          read: false
        });

        return {
          ...user.toObject(),
          latestMessage,
          unreadCount
        };
      })
    );
    
    // Sort by latest message date (descending)
    usersWithLatestMessage.sort((a, b) => {
      const dateA = a.latestMessage ? new Date(a.latestMessage.createdAt) : new Date(0);
      const dateB = b.latestMessage ? new Date(b.latestMessage.createdAt) : new Date(0);
      return dateB - dateA;
    });

    res.json(usersWithLatestMessage);
  } catch (error) {
    console.error("Error fetching chat users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get chat history for a user
router.get("/:userId", auth, async (req, res) => {
  try {
    // If not admin, verify that the requester is asking for their own chat
    if (req.role !== "admin" && req.userId !== req.params.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const chats = await Chat.find({ user: req.params.userId })
      .sort({ createdAt: 1 });

    res.json(chats);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Mark messages as read
router.post("/read/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // If admin, mark messages sent by 'user' as read
    if (req.role === "admin") {
      await Chat.updateMany(
        { user: userId, sender: "user", read: false },
        { $set: { read: true } }
      );
    } 
    // If user, mark messages sent by 'admin' as read
    else if (req.userId === userId) {
      await Chat.updateMany(
        { user: userId, sender: "admin", read: false },
        { $set: { read: true } }
      );
    } else {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
