import express from "express";
import multer from "multer";
import fs from "fs";
import mongoose from "mongoose";
import SalesCustomer from "../models/SalesCustomer.js";
import ProductMaster from "../models/ProductMaster.js";
import { convertCSV } from "../services/csvConverter.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { generateAndSaveSummary } from "../services/generateSummary.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload-sales-customer", verifyToken, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ message: "Database not connected" });
    }

    const productMaster = await ProductMaster.find({
      userId: new mongoose.Types.ObjectId(req.user.id)
    });
    console.log("ProductMaster count:", productMaster.length);

    const csvText = fs.readFileSync(req.file.path, "utf8");
    const convertedData = convertCSV(csvText, productMaster).map(row => ({
      ...row,
      userId: req.user.id,
    }));

    await SalesCustomer.insertMany(convertedData);
    console.log("✅ Sales data saved:", convertedData.length, "rows");

    try {
      await generateAndSaveSummary(req.user.id);
      console.log("✅ AI Summary generated");
    } catch (summaryError) {
      console.error("❌ AI Summary failed:", summaryError.message);
    }

    res.json({
      message: "CSV uploaded & saved successfully",
      rows_saved: convertedData.length,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;