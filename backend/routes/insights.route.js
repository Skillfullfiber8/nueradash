import express from "express";
import mongoose from "mongoose";
import SalesCustomer from "../models/SalesCustomer.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/summary", verifyToken, async (req, res) => {
  try {
    const result = await SalesCustomer.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user.id) } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalAmount" },
          totalProfit: { $sum: "$profitMargin" },
          count: { $sum: 1 },
        },
      },
    ]);
    res.json(result[0] || { totalSales: 0, totalProfit: 0, count: 0 });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err });
  }
});

router.get("/top-products", verifyToken, async (req, res) => {
  try {
    const result = await SalesCustomer.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user.id) } },
      {
        $group: {
          _id: "$productName",
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Error", error: err });
  }
});

router.get("/sales-by-region", verifyToken, async (req, res) => {
  try {
    const result = await SalesCustomer.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user.id) } },
      {
        $group: {
          _id: "$region",
          totalSales: { $sum: "$totalAmount" },
        },
      },
      { $sort: { totalSales: -1 } },
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Error", error: err });
  }
});

export default router;