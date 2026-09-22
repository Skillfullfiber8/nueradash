// clearSales.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import Sales from "./models/Sales.js";

dotenv.config();

async function clearSalesData() {
  try {
    console.log("🧹 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const result = await Sales.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} sales records.`);

    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB.");
  } catch (error) {
    console.error("❌ Error clearing sales:", error);
  }
}

clearSalesData();

