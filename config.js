const mongoose = require("mongoose");
require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {family:4});
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;