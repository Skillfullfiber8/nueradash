import express from "express";
import multer from "multer";
import Sales from "../models/Sales.js";
import { convertCSV } from "../services/csvConverter.js";

const router = express.Router();
const upload = multer();

router.post("/sales-standardized", upload.single("file"), async (req, res) => {
  try {
    console.log("📂 File received:", !!req.file);
    console.log("🧾 ProductMaster:", req.body.productMaster ? "Present" : "Missing");

    if (!req.file) return res.status(400).json({ error: "CSV file is required" });
    if (!req.body.productMaster) return res.status(400).json({ error: "Product master JSON is required" });

    const csvText = req.file.buffer.toString("utf-8");
    console.log("📄 CSV Sample (first 300 chars):", csvText.slice(0, 300));

    let productMaster;
    try {
      productMaster = JSON.parse(req.body.productMaster);
      console.log("✅ Product master parsed successfully");
    } catch (jsonErr) {
      console.error("❌ Invalid JSON in productMaster:", jsonErr.message);
      return res.status(400).json({ error: "Invalid productMaster JSON" });
    }

    const standardized = convertCSV(csvText, productMaster);
    console.log("✅ Standardized rows:", standardized.length);

    await Sales.insertMany(standardized);

    return res.json({
      success: true,
      count: standardized.length,
      message: "Sales data standardized + stored successfully",
    });
  } catch (error) {
    console.error("🔥 CSV Standardization Error:", error);
    return res.status(500).json({ error: error.message || "Failed to process CSV" });
  }
});

export default router;
