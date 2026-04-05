import express from "express";
import multer from "multer";
import fs from "fs";
import Papa from "papaparse";
import Groq from "groq-sdk";
import mongoose from "mongoose";
import SalesCustomer from "../models/SalesCustomer.js";
import ProductMaster from "../models/ProductMaster.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { generateAndSaveSummary } from "../services/generateSummary.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

const TARGET_COLUMNS = [
  "Sale ID", "Customer Name", "Region", "Customer Email",
  "Customer Phone", "Product ID", "Product Name", "Category",
  "Quantity", "Price", "Date", "Location", "Payment Method"
];

// Step 1 — Upload CSV and get AI column mapping suggestions
router.post("/analyze", verifyToken, upload.single("file"), async (req, res) => {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const csvText = fs.readFileSync(req.file.path, "utf8");
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    const uploadedColumns = parsed.meta.fields;
    const sampleRows = parsed.data.slice(0, 3);

    const prompt = `
You are a data mapping assistant. The user has uploaded a CSV with these columns:
${JSON.stringify(uploadedColumns)}

Sample data:
${JSON.stringify(sampleRows, null, 2)}

Map each uploaded column to one of these target columns (or "skip" if no match):
${JSON.stringify(TARGET_COLUMNS)}

Respond ONLY with a valid JSON object like this:
{
  "Sale ID": "uploaded_column_name or skip",
  "Customer Name": "uploaded_column_name or skip",
  "Region": "uploaded_column_name or skip",
  "Customer Email": "uploaded_column_name or skip",
  "Customer Phone": "uploaded_column_name or skip",
  "Product ID": "uploaded_column_name or skip",
  "Product Name": "uploaded_column_name or skip",
  "Category": "uploaded_column_name or skip",
  "Quantity": "uploaded_column_name or skip",
  "Price": "uploaded_column_name or skip",
  "Date": "uploaded_column_name or skip",
  "Location": "uploaded_column_name or skip",
  "Payment Method": "uploaded_column_name or skip"
}
No explanation, no markdown, only the JSON object.
    `;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });

    const raw = completion.choices[0].message.content.trim();
    const mapping = JSON.parse(raw);

    res.json({
      uploadedColumns,
      mapping,
      sampleRows,
      filePath: req.file.path,
      fileName: req.file.filename,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error analyzing file", error: err.message });
  }
});

// Step 2 — Apply confirmed mapping and save to DB
router.post("/import", verifyToken, async (req, res) => {
  try {
    const { filePath, mapping } = req.body;

    if (!filePath || !mapping) {
      return res.status(400).json({ message: "Missing filePath or mapping" });
    }

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({ message: "Database not connected" });
    }

    const csvText = fs.readFileSync(filePath, "utf8");
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    const rows = parsed.data;

    const productMaster = await ProductMaster.find();
    console.log("ProductMaster count in smart import:", productMaster.length);

    const productMap = {};
    productMaster.forEach((p) => {
      productMap[p.productId] = p;
      console.log("Mapped:", p.productId, "costPrice:", p.costPrice);
    });

    const standardized = rows.map((row, index) => {
      const mapped = {};
      for (const [targetCol, sourceCol] of Object.entries(mapping)) {
        if (sourceCol && sourceCol !== "skip") {
          mapped[targetCol] = row[sourceCol] || "";
        }
      }

      const product = productMap[mapped["Product ID"]] || {};
      console.log("Row Product ID:", mapped["Product ID"], "Found:", product.productName || "NOT FOUND");

      const quantity = Number(mapped["Quantity"]) || 0;
      const price = Number(mapped["Price"]) || product.sellingPrice || 0;
      const costPrice = product.costPrice || 0;
      const sellingPrice = product.sellingPrice || price;
      const profitPerUnit = sellingPrice - costPrice;

      return {
        saleId: mapped["Sale ID"] || `AUTO-${index + 1}`,
        customerName: mapped["Customer Name"] || "",
        region: mapped["Region"] || "",
        email: mapped["Customer Email"] || "",
        phone: mapped["Customer Phone"] || "",
        productId: mapped["Product ID"] || "",
        productName: mapped["Product Name"] || product.productName || "",
        category: mapped["Category"] || product.category || "",
        quantity,
        price,
        totalAmount: quantity * price,
        date: mapped["Date"] ? new Date(mapped["Date"]) : null,
        location: mapped["Location"] || "",
        paymentMethod: mapped["Payment Method"] || "",
        costPrice,
        sellingPrice,
        profitMargin: profitPerUnit * quantity,
        userId: req.user.id,
      };
    });

    await SalesCustomer.insertMany(standardized);
    await generateAndSaveSummary(req.user.id);

    res.json({
      message: "Data imported successfully!",
      rows_saved: standardized.length,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Import failed", error: err.message });
  }
});

export default router;