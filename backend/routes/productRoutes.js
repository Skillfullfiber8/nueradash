import express from "express";
import multer from "multer";
import csv from "csvtojson";
import path from "path";

const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    cb(null, "product_master.csv");
  },
});

const upload = multer({ storage });

router.post("/upload-product-master", upload.single("file"), async (req, res) => {
  try {
    const filePath = path.join("uploads", "product_master.csv");
    const jsonArray = await csv().fromFile(filePath);

    res.json({
      message: "✅ Product master uploaded successfully",
      products: jsonArray,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error uploading product master",
      error: error.message,
    });
  }
});

export default router;
