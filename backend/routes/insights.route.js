import express from "express";
import mongoose from "mongoose";
import Groq from "groq-sdk";
import SalesCustomer from "../models/SalesCustomer.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import AiSummary from "../models/AiSummary.js";

const router = express.Router();

// Summary
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

// Top Products
router.get("/top-products", verifyToken, async (req, res) => {
  try {
    const result = await SalesCustomer.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: "$productName", totalRevenue: { $sum: "$totalAmount" } } },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Error", error: err });
  }
});

// Sales by Region
router.get("/sales-by-region", verifyToken, async (req, res) => {
  try {
    const result = await SalesCustomer.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: "$region", totalSales: { $sum: "$totalAmount" } } },
      { $sort: { totalSales: -1 } },
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Error", error: err });
  }
});

// Sales by Category
router.get("/sales-by-category", verifyToken, async (req, res) => {
  try {
    const result = await SalesCustomer.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: "$category", totalSales: { $sum: "$totalAmount" } } },
      { $sort: { totalSales: -1 } },
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Error", error: err });
  }
});

// Payment Method Distribution
router.get("/payment-methods", verifyToken, async (req, res) => {
  try {
    const result = await SalesCustomer.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: "$paymentMethod", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Error", error: err });
  }
});

// Sales Trend over time
router.get("/sales-trend", verifyToken, async (req, res) => {
  try {
    const result = await SalesCustomer.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user.id), date: { $ne: null } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          totalSales: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Error", error: err });
  }
});

// Sales Prediction — linear regression for next 7 days
router.get("/sales-prediction", verifyToken, async (req, res) => {
  try {
    const result = await SalesCustomer.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user.id), date: { $ne: null } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          totalSales: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    if (result.length < 2) {
      return res.json({ historical: result, predicted: [] });
    }

    // Linear regression
    const n = result.length;
    const xValues = result.map((_, i) => i);
    const yValues = result.map(r => r.totalSales);

    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict next 7 days
    const lastDate = new Date(result[result.length - 1]._id);
    const predicted = [];
    for (let i = 1; i <= 7; i++) {
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + i);
      const predictedSales = Math.max(0, Math.round(slope * (n + i - 1) + intercept));
      predicted.push({
        _id: nextDate.toISOString().split("T")[0],
        totalSales: predictedSales,
        predicted: true,
      });
    }

    res.json({ historical: result, predicted });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err });
  }
});

// Sales by City
router.get("/sales-by-city", verifyToken, async (req, res) => {
  try {
    const result = await SalesCustomer.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: "$location", totalSales: { $sum: "$totalAmount" } } },
      { $sort: { totalSales: -1 } },
      { $limit: 8 },
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Error", error: err });
  }
});

// Top Customers
router.get("/top-customers", verifyToken, async (req, res) => {
  try {
    const result = await SalesCustomer.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user.id) } },
      {
        $group: {
          _id: "$customerName",
          totalSpent: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Error", error: err });
  }
});

// Repeat vs New Customers
router.get("/customer-types", verifyToken, async (req, res) => {
  try {
    const result = await SalesCustomer.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: "$customerName", orders: { $sum: 1 } } },
      {
        $group: {
          _id: null,
          repeatCustomers: { $sum: { $cond: [{ $gt: ["$orders", 1] }, 1, 0] } },
          newCustomers: { $sum: { $cond: [{ $eq: ["$orders", 1] }, 1, 0] } },
        },
      },
    ]);
    res.json(result[0] || { repeatCustomers: 0, newCustomers: 0 });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err });
  }
});

// AI Summary
router.get("/ai-summary", verifyToken, async (req, res) => {
  try {
    const existing = await AiSummary.findOne({
      userId: new mongoose.Types.ObjectId(req.user.id)
    });
    if (existing) {
      return res.json({ summary: existing.summary, generatedAt: existing.generatedAt });
    }
    res.json({ summary: "No summary yet. Upload data to generate one.", generatedAt: null });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});


// Get sales grouped by date (with optional date filter)
router.get("/sales-records", verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = { userId: new mongoose.Types.ObjectId(req.user.id) };

    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        match.date.$lte = end;
      }
    }

    const result = await SalesCustomer.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          orders: { $sum: 1 },
          totalSales: { $sum: "$totalAmount" },
          totalProfit: { $sum: "$profitMargin" },
          records: { $push: "$$ROOT" },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Update a single sales record
router.put("/sales-records/:id", verifyToken, async (req, res) => {
  try {
    const updated = await SalesCustomer.findOneAndUpdate(
      { _id: req.params.id, userId: new mongoose.Types.ObjectId(req.user.id) },
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Record not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Delete a single sales record
router.delete("/sales-records/:id", verifyToken, async (req, res) => {
  try {
    const deleted = await SalesCustomer.findOneAndDelete({
      _id: req.params.id,
      userId: new mongoose.Types.ObjectId(req.user.id)
    });
    if (!deleted) return res.status(404).json({ message: "Record not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Delete all sales records for this user
router.delete("/sales-records", verifyToken, async (req, res) => {
  try {
    await SalesCustomer.deleteMany({
      userId: new mongoose.Types.ObjectId(req.user.id)
    });
    res.json({ message: "All records deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error", error: err.message });
  }
});

// Chatbot route
router.post("/chat", verifyToken, async (req, res) => {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  try {
    const { message, history } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Fetch user's data as context
    const [summary, topProducts, regions, categories, topCustomers, trend] = await Promise.all([
      SalesCustomer.aggregate([
        { $match: { userId } },
        { $group: { _id: null, totalSales: { $sum: "$totalAmount" }, totalProfit: { $sum: "$profitMargin" }, count: { $sum: 1 } } },
      ]),
      SalesCustomer.aggregate([
        { $match: { userId } },
        { $group: { _id: "$productName", totalRevenue: { $sum: "$totalAmount" }, totalProfit: { $sum: "$profitMargin" }, units: { $sum: "$quantity" } } },
        { $sort: { totalRevenue: -1 } }, { $limit: 10 },
      ]),
      SalesCustomer.aggregate([
        { $match: { userId } },
        { $group: { _id: "$region", totalSales: { $sum: "$totalAmount" } } },
        { $sort: { totalSales: -1 } },
      ]),
      SalesCustomer.aggregate([
        { $match: { userId } },
        { $group: { _id: "$category", totalSales: { $sum: "$totalAmount" }, totalProfit: { $sum: "$profitMargin" } } },
        { $sort: { totalSales: -1 } },
      ]),
      SalesCustomer.aggregate([
        { $match: { userId } },
        { $group: { _id: "$customerName", totalSpent: { $sum: "$totalAmount" }, orders: { $sum: 1 } } },
        { $sort: { totalSpent: -1 } }, { $limit: 10 },
      ]),
      SalesCustomer.aggregate([
        { $match: { userId, date: { $ne: null } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, totalSales: { $sum: "$totalAmount" } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const context = `
You are a smart business analytics assistant for Nueradash. You have access to the user's sales data below. Answer questions clearly and concisely based only on this data. If the answer is not in the data, say so.

SALES DATA:
- Total Sales: ₹${summary[0]?.totalSales || 0}
- Total Profit: ₹${summary[0]?.totalProfit || 0}
- Total Orders: ${summary[0]?.count || 0}

TOP PRODUCTS (by revenue):
${topProducts.map(p => `  • ${p._id}: Revenue ₹${p.totalRevenue}, Profit ₹${p.totalProfit}, Units sold: ${p.units}`).join("\n")}

SALES BY REGION:
${regions.map(r => `  • ${r._id}: ₹${r.totalSales}`).join("\n")}

SALES BY CATEGORY:
${categories.map(c => `  • ${c._id}: Revenue ₹${c.totalSales}, Profit ₹${c.totalProfit}`).join("\n")}

TOP CUSTOMERS:
${topCustomers.map(c => `  • ${c._id}: Spent ₹${c.totalSpent}, Orders: ${c.orders}`).join("\n")}

DAILY SALES TREND:
${trend.map(t => `  • ${t._id}: ₹${t.totalSales}`).join("\n")}

Answer in 2-4 sentences. Be direct and helpful. Use ₹ for currency. Do not use markdown formatting.
    `;

    // Build messages with history
    const messages = [
      { role: "system", content: context },
      ...(history || []).slice(-6).map(h => ({
        role: h.role,
        content: h.content
      })),
      { role: "user", content: message }
    ];

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.5,
      max_tokens: 300,
    });

    res.json({ reply: completion.choices[0].message.content.trim() });

  } catch (err) {
    console.error("Chat error:", err.message);
    res.status(500).json({ message: "Chat failed", error: err.message });
  }
});

export default router;