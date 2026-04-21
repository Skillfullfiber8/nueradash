import express from "express";
import mongoose from "mongoose";
import ProductMaster from "../models/ProductMaster.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all — only this user's products
router.get("/", verifyToken, async (req, res) => {
  try {
    const products = await ProductMaster.find({
      userId: new mongoose.Types.ObjectId(req.user.id)
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Add one — attach userId
router.post("/", verifyToken, async (req, res) => {
  try {
    const product = new ProductMaster({
      ...req.body,
      userId: req.user.id,
    });
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Update one — verify ownership
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const updated = await ProductMaster.findOneAndUpdate(
      { _id: req.params.id, userId: new mongoose.Types.ObjectId(req.user.id) },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Product not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Delete one — verify ownership
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const deleted = await ProductMaster.findOneAndDelete({
      _id: req.params.id,
      userId: new mongoose.Types.ObjectId(req.user.id)
    });
    if (!deleted) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

export default router;