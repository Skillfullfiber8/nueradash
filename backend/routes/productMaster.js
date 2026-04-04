import express from "express";
import ProductMaster from "../models/ProductMaster.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all
router.get("/", verifyToken, async (req, res) => {
  try {
    const products = await ProductMaster.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Add one
router.post("/", verifyToken, async (req, res) => {
  try {
    const product = new ProductMaster(req.body);
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Update one
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const updated = await ProductMaster.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Delete one
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await ProductMaster.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

export default router;