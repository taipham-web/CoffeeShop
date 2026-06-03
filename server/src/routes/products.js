const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const checkAdmin = require("../middleware/checkAdmin");

// GET /products?category=Cappuccino
router.get("/", async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { isAvailable: true };
    if (category && category !== "All") {
      filter.category = { $regex: new RegExp(`^${category}$`, "i") };
    }
    const products = await Product.find(filter).sort({ rating: -1 });
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /products/categories – danh sách category duy nhất
router.get("/categories", async (req, res) => {
  try {
    const categories = await Product.distinct("category", {
      isAvailable: true,
    });
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /products/:id
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /products (tạo mới) - chỉ admin
router.post("/", checkAdmin, async (req, res) => {
  try {
    const { name, subtitle, category, price, imageUrl, description, sizes } = req.body;
    if (!name || !price || !category) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }
    const product = await Product.create({
      name,
      subtitle: subtitle || "",
      category,
      price,
      imageUrl: imageUrl || "",
      description: description || "",
      isAvailable: true,
      rating: 0,
      sizes: sizes || [],
    });
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT /products/:id - chỉ admin
router.put("/:id", checkAdmin, async (req, res) => {
  try {
    const { name, subtitle, category, price, imageUrl, description, sizes } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (subtitle !== undefined) updateData.subtitle = subtitle;
    if (category !== undefined) updateData.category = category;
    if (price !== undefined) updateData.price = price;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (description !== undefined) updateData.description = description;
    if (sizes !== undefined) updateData.sizes = sizes;

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// DELETE /products/:id - chỉ admin
router.delete("/:id", checkAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// POST /products/seed – seed dữ liệu mẫu (dev only)
router.post("/seed", async (req, res) => {
  try {
    await Product.deleteMany({});
    const seedData = [
      {
        name: "Cappucino",
        subtitle: "with Chocolate",
        category: "Cappuccino",
        price: 4.53,
        rating: 4.8,
        imageUrl:
          "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400",
        description:
          "Rich espresso with steamed milk foam and chocolate drizzle.",
      },
      {
        name: "Cappucino",
        subtitle: "with Oat Milk",
        category: "Cappuccino",
        price: 4.53,
        rating: 4.8,
        imageUrl:
          "https://images.unsplash.com/photo-1485808191679-5f86510bd9d4?w=400",
        description: "Creamy cappuccino made with oat milk.",
      },
      {
        name: "Cappucino",
        subtitle: "Classic",
        category: "Cappuccino",
        price: 4.5,
        rating: 4.5,
        imageUrl:
          "https://images.unsplash.com/photo-1534778101976-62847782c213?w=400",
        description: "Classic Italian cappuccino with perfect foam.",
      },
      {
        name: "Cappucino",
        subtitle: "Iced",
        category: "Cappuccino",
        price: 4.2,
        rating: 4.0,
        imageUrl:
          "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400",
        description: "Refreshing iced cappuccino, perfect for hot days.",
      },
      {
        name: "Machiato",
        subtitle: "with Caramel",
        category: "Machiato",
        price: 5.1,
        rating: 4.7,
        imageUrl:
          "https://images.unsplash.com/photo-1551030173-122aabc4489c?w=400",
        description: "Bold espresso with a touch of steamed milk and caramel.",
      },
      {
        name: "Machiato",
        subtitle: "Classic",
        category: "Machiato",
        price: 4.75,
        rating: 4.6,
        imageUrl:
          "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=400",
        description: "Traditional espresso machiato topped with foam.",
      },
      {
        name: "Latte",
        subtitle: "Vanilla",
        category: "Latte",
        price: 4.8,
        rating: 4.9,
        imageUrl:
          "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=400",
        description: "Smooth latte with vanilla syrup.",
      },
      {
        name: "Latte",
        subtitle: "Hazelnut",
        category: "Latte",
        price: 5.0,
        rating: 4.7,
        imageUrl:
          "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400",
        description: "Creamy latte flavored with hazelnut.",
      },
      {
        name: "Americano",
        subtitle: "Black",
        category: "Americano",
        price: 3.5,
        rating: 4.4,
        imageUrl:
          "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400",
        description: "Simple yet bold black americano.",
      },
      {
        name: "Americano",
        subtitle: "with Milk",
        category: "Americano",
        price: 3.8,
        rating: 4.3,
        imageUrl:
          "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400",
        description: "Smooth americano with a splash of fresh milk.",
      },
      {
        name: "Espresso",
        subtitle: "Double Shot",
        category: "Espresso",
        price: 3.0,
        rating: 4.6,
        imageUrl:
          "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400",
        description: "Intense double shot espresso.",
      },
    ];

    const created = await Product.insertMany(seedData);
    res.json({ success: true, message: `Seeded ${created.length} products` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
