import express from "express";
import mongoose from "mongoose";
import { generateChatReply } from "../services/aiService.js";
import SalesCustomer from "../models/SalesCustomer.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import AiSummary from "../models/AiSummary.js";
import { generateAndSaveSummary } from "../services/generateSummary.js";

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
    console.error("[INSIGHTS_SUMMARY] Error:", err.message);
    res.status(500).json({ success: false, message: "Error fetching summary metrics", error: err.message });
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
    console.error("[TOP_PRODUCTS] Error:", err.message);
    res.status(500).json({ success: false, message: "Error fetching top products", error: err.message });
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
    console.error("[SALES_BY_REGION] Error:", err.message);
    res.status(500).json({ success: false, message: "Error fetching sales by region", error: err.message });
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
    console.error("[SALES_BY_CATEGORY] Error:", err.message);
    res.status(500).json({ success: false, message: "Error fetching sales by category", error: err.message });
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
    console.error("[PAYMENT_METHODS] Error:", err.message);
    res.status(500).json({ success: false, message: "Error fetching payment methods", error: err.message });
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
    console.error("[SALES_TREND] Error:", err.message);
    res.status(500).json({ success: false, message: "Error fetching sales trend", error: err.message });
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

    const n = result.length;
    const xValues = result.map((_, i) => i);
    const yValues = result.map(r => r.totalSales);

    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = yValues.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

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
    console.error("[SALES_PREDICTION] Error:", err.message);
    res.status(500).json({ success: false, message: "Error generating sales prediction", error: err.message });
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
    console.error("[SALES_BY_CITY] Error:", err.message);
    res.status(500).json({ success: false, message: "Error fetching sales by city", error: err.message });
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
    console.error("[TOP_CUSTOMERS] Error:", err.message);
    res.status(500).json({ success: false, message: "Error fetching top customers", error: err.message });
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
    console.error("[CUSTOMER_TYPES] Error:", err.message);
    res.status(500).json({ success: false, message: "Error fetching customer types", error: err.message });
  }
});

// AI Summary — fetch from DB
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
    console.error("[GET_AI_SUMMARY] Error:", err.message);
    res.status(500).json({ success: false, message: "Error fetching AI summary", error: err.message });
  }
});

// Regenerate AI Summary manually
router.post("/regenerate-summary", verifyToken, async (req, res) => {
  try {
    console.log(`[AI_SUMMARY] Manual regenerate requested by user: ${req.user.id}`);
    const summary = await generateAndSaveSummary(req.user.id);
    res.json({ success: true, message: "Summary regenerated", summary });
  } catch (err) {
    console.error("[REGENERATE_AI_SUMMARY] Error:", err.message);
    const statusCode = err.status || 500;
    res.status(statusCode).json({ success: false, message: "Failed to generate AI summary", error: err.message });
  }
});

// Chatbot
router.post("/chat", verifyToken, async (req, res) => {
  try {
    console.log(`[CHATBOT] Request received for user: ${req.user.id}`);
    const { message, history } = req.body;
    if (!message || typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({ success: false, message: "Message cannot be empty." });
    }

    const userId = new mongoose.Types.ObjectId(req.user.id);

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
You are a smart business analytics assistant for Nueradash. Answer questions based only on the data below. Be concise and direct. Use ₹ for currency. No markdown.

Total Sales: ₹${summary[0]?.totalSales || 0}
Total Profit: ₹${summary[0]?.totalProfit || 0}
Total Orders: ${summary[0]?.count || 0}

Top Products: ${topProducts.map(p => `${p._id} (Revenue ₹${p.totalRevenue}, Profit ₹${p.totalProfit}, Units ${p.units})`).join(", ")}
Regions: ${regions.map(r => `${r._id} ₹${r.totalSales}`).join(", ")}
Categories: ${categories.map(c => `${c._id} Revenue ₹${c.totalSales} Profit ₹${c.totalProfit}`).join(", ")}
Top Customers: ${topCustomers.map(c => `${c._id} ₹${c.totalSpent} (${c.orders} orders)`).join(", ")}
Daily Trend: ${trend.map(t => `${t._id}: ₹${t.totalSales}`).join(", ")}
    `;

    console.log(`[CHATBOT] Invoking Gemini API for user query: "${message.slice(0, 50)}..."`);
    const reply = await generateChatReply({
      systemContext: context,
      history,
      message,
    });
    console.log(`[CHATBOT] Gemini responded successfully.`);

    res.json({ success: true, reply });

  } catch (err) {
    console.error("[CHATBOT] Error processing chat query:", err.message);
    const statusCode = err.status || 500;
    res.status(statusCode).json({
      success: false,
      message: err.message || "Failed to process chat query with AI assistant",
      error: err.code || "CHAT_ERROR",
    });
  }
});

// Delete all sales records (STATIC route before parameterized route)
router.delete("/sales-records", verifyToken, async (req, res) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.user.id);
    console.log(`[CLEAR_DATA] User ${req.user.id} initiated clear all sales records`);

    const [deletedSales] = await Promise.all([
      SalesCustomer.deleteMany({ userId: userObjectId }),
      AiSummary.findOneAndUpdate(
        { userId: userObjectId },
        { summary: "No summary yet. Upload data to generate one.", generatedAt: new Date() },
        { upsert: true, new: true }
      ),
    ]);

    console.log(`[CLEAR_DATA] Successfully cleared ${deletedSales.deletedCount} transactions for user ${req.user.id}`);
    res.json({
      success: true,
      message: "All sales records and summary cleared successfully.",
      deletedCount: deletedSales.deletedCount,
    });
  } catch (err) {
    console.error("[CLEAR_DATA] Error clearing records:", err.message);
    res.status(500).json({ success: false, message: "Failed to clear sales records", error: err.message });
  }
});

// Get sales grouped by date
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
    console.error("[GET_SALES_RECORDS] Error:", err.message);
    res.status(500).json({ success: false, message: "Error fetching sales records", error: err.message });
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
    if (!updated) return res.status(404).json({ success: false, message: "Record not found" });
    res.json({ success: true, record: updated });
  } catch (err) {
    console.error("[UPDATE_SALES_RECORD] Error:", err.message);
    res.status(500).json({ success: false, message: "Error updating sales record", error: err.message });
  }
});

// Delete a single sales record
router.delete("/sales-records/:id", verifyToken, async (req, res) => {
  try {
    const deleted = await SalesCustomer.findOneAndDelete({
      _id: req.params.id,
      userId: new mongoose.Types.ObjectId(req.user.id)
    });
    if (!deleted) return res.status(404).json({ success: false, message: "Record not found" });
    res.json({ success: true, message: "Record deleted successfully" });
  } catch (err) {
    console.error("[DELETE_SINGLE_RECORD] Error:", err.message);
    res.status(500).json({ success: false, message: "Error deleting sales record", error: err.message });
  }
});

export default router;