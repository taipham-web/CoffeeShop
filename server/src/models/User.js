const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    // ── Profile fields ──
    name: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    // ── Forgot Password fields ──
    resetPasswordOtp: { type: String, default: "" },
    resetPasswordExpires: { type: Date },
    // ── Wishlist fields ──
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    // ── Push Notification fields ──
    expoPushToken: { type: String, default: "" },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
