const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  size: {
    type: String,
    default: "",
  },
  name: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: "",
  },
  imageUrl: {
    type: String,
    default: "",
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    orderType: {
      type: String,
      enum: ["delivery", "pickup"],
      default: "delivery",
    },
    deliveryAddress: {
      title: { type: String, default: "" },
      detail: { type: String, default: "" },
      note: { type: String, default: "" },
    },
    discountApplied: {
      type: String,
      default: "", // We can keep this as a comma-separated string for display purposes or backward compatibility
    },
    voucherIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Voucher"
    }],
    subTotal: {
      type: Number,
      required: true,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    totalPayment: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Card", "Wallet"],
      default: "Cash",
    },
    status: {
      type: String,
      enum: ["pending", "processing", "delivering", "completed", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
