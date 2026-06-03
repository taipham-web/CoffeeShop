// ⚠️ dotenv.config() PHẢI được gọi trước tất cả các require khác
// để env vars có sẵn khi các module được load (Cloudinary, JWT, v.v.)
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const uploadRoutes = require("./routes/upload");
const profileRoutes = require("./routes/profile");
const orderRoutes = require("./routes/orders");
const cartRoutes = require("./routes/cart");
const Chat = require("./models/Chat");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5001;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/coffeeshop";

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/upload", uploadRoutes);
app.use("/profile", profileRoutes);
app.use("/orders", orderRoutes);
app.use("/cart", cartRoutes);
app.use("/wishlist", require("./routes/wishlist"));
app.use("/banners", require("./routes/banners"));
app.use("/branches", require("./routes/branches"));
app.use("/vouchers", require("./routes/vouchers"));
app.use("/notifications", require("./routes/notifications"));
app.use("/chat", require("./routes/chat"));

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Both user and admin join a room named by the userId
  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`Socket ${socket.id} joined room: ${userId}`);
  });

  socket.on("sendMessage", async (data) => {
    try {
      const newChat = new Chat({
        user: data.user,
        sender: data.sender,
        message: data.message,
      });
      await newChat.save();

      // Emit to the specific user's room (so both the user and the admin viewing that chat see it)
      io.to(data.user).emit("receiveMessage", newChat);

      // Emit a global notification for admin list updates
      io.emit("newMessageNotification", newChat);
    } catch (err) {
      console.error("Socket sendMessage error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

async function startServer() {
  if (!process.env.JWT_SECRET) {
    throw new Error("Missing JWT_SECRET in environment variables.");
  }

  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB connected");

  // Start background jobs
  const { startAutoCancelJob } = require("./jobs/autoCancelOrders");
  startAutoCancelJob();

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Auth server running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
