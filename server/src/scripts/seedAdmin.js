require("dotenv").config({ path: "../../.env" });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function seedAdmin() {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/coffeeshop";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    const email = "admin@gmail.com";
    const password = "password123";

    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log("Admin account already exists:", email);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const adminUser = await User.create({
      email,
      password: hashedPassword,
      role: "admin",
      name: "Super Admin",
    });

    console.log("Admin account created successfully!");
    console.log("Email:", adminUser.email);
    console.log("Password:", password);
  } catch (error) {
    console.error("Failed to seed admin:", error);
  } finally {
    mongoose.connection.close();
  }
}

seedAdmin();
