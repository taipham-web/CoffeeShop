const express = require("express");
const router = express.Router();
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const auth = require("../middleware/auth");

// Get user cart
router.get("/", auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.userId }).populate("items.product");
    if (!cart) {
      cart = await Cart.create({ user: req.userId, items: [] });
    }
    res.json(cart);
  } catch (err) {
    console.error("Error fetching cart:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

// Add item to cart
router.post("/add", auth, async (req, res) => {
  try {
    const { productId, quantity = 1, size = "", price } = req.body;
    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      cart = new Cart({ user: req.userId, items: [] });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId && item.size === size
    );
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity, size, price });
    }

    await cart.save();
    const updatedCart = await cart.populate("items.product");
    res.json(updatedCart);
  } catch (err) {
    console.error("Error adding to cart:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

// Update item quantity
router.put("/update", auth, async (req, res) => {
  try {
    const { productId, quantity, size = "" } = req.body;
    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId && item.size === size
    );
    if (itemIndex > -1) {
      if (quantity <= 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity = quantity;
      }
      await cart.save();
      const updatedCart = await cart.populate("items.product");
      res.json(updatedCart);
    } else {
      res.status(404).json({ error: "Item not found in cart" });
    }
  } catch (err) {
    console.error("Error updating cart:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

// Remove item from cart
router.delete("/remove/:productId/:size?", auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    const size = req.params.size || "";
    cart.items = cart.items.filter(
      (item) => !(item.product.toString() === req.params.productId && item.size === size)
    );
    await cart.save();
    const updatedCart = await cart.populate("items.product");
    res.json(updatedCart);
  } catch (err) {
    console.error("Error removing from cart:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

// Clear cart
router.delete("/clear", auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.userId });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ message: "Cart cleared" });
  } catch (err) {
    console.error("Error clearing cart:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;
