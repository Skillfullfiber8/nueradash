import express from "express";
import mongoose from "mongoose";
import { verifyToken } from "../middleware/authMiddleware.js";
import { scanBusinessRadar } from "../services/radarEngine.js";
import { analyzeRootCauses } from "../services/rootCauseEngine.js";
import { runSimulation } from "../services/simulationEngine.js";
import { generateActionPlan } from "../services/actionPlannerEngine.js";
import SalesCustomer from "../models/SalesCustomer.js";
import ProductMaster from "../models/ProductMaster.js";

const router = express.Router();

/**
 * GET /api/decision/overview
 * Comprehensive snapshot of the Decision Intelligence Layer
 */
router.get("/overview", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [radar, rootCause, actionPlan, products] = await Promise.all([
      scanBusinessRadar(userId),
      analyzeRootCauses(userId),
      generateActionPlan(userId),
      ProductMaster.find({ userId: new mongoose.Types.ObjectId(userId) }),
    ]);

    res.json({
      status: "success",
      radar,
      rootCause,
      actionPlan,
      products: products.map((p) => ({
        id: p.productId,
        name: p.productName,
        category: p.category,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
      })),
    });
  } catch (err) {
    console.error("Decision Overview Error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

/**
 * GET /api/decision/radar
 * Unified Risk & Opportunity Radar
 */
router.get("/radar", verifyToken, async (req, res) => {
  try {
    const data = await scanBusinessRadar(req.user.id);
    res.json(data);
  } catch (err) {
    console.error("Radar Error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

/**
 * GET /api/decision/root-cause
 * Deep-dive period-over-period Root Cause Analysis
 */
router.get("/root-cause", verifyToken, async (req, res) => {
  try {
    const metric = req.query.metric || "revenue";
    const data = await analyzeRootCauses(req.user.id, metric);
    res.json(data);
  } catch (err) {
    console.error("Root Cause Error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

/**
 * POST /api/decision/simulate
 * Run What-If sandbox simulation without modifying DB
 */
router.post("/simulate", verifyToken, async (req, res) => {
  try {
    const config = req.body;
    const result = await runSimulation(req.user.id, config);
    res.json(result);
  } catch (err) {
    console.error("Simulation Error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

/**
 * GET /api/decision/action-plans
 * Synthesized prioritized action recommendations
 */
router.get("/action-plans", verifyToken, async (req, res) => {
  try {
    const plan = await generateActionPlan(req.user.id);
    res.json(plan);
  } catch (err) {
    console.error("Action Plan Error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

/**
 * GET /api/decision/predictions
 * Extended multi-horizon forecast & churn risk assessment
 */
router.get("/predictions", verifyToken, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Fetch daily trend
    const dailyData = await SalesCustomer.aggregate([
      { $match: { userId, date: { $ne: null } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          totalSales: { $sum: "$totalAmount" },
          totalProfit: { $sum: "$profitMargin" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    if (dailyData.length < 3) {
      return res.json({
        status: "insufficient_data",
        message: "Insufficient historical data for reliable multi-horizon prediction.",
        forecasts: [],
      });
    }

    // Linear regression forecast for next 14 days
    const n = dailyData.length;
    const xVals = dailyData.map((_, i) => i);
    const ySales = dailyData.map((d) => d.totalSales);
    const yProfit = dailyData.map((d) => d.totalProfit);

    const sumX = xVals.reduce((a, b) => a + b, 0);
    const sumX2 = xVals.reduce((sum, x) => sum + x * x, 0);

    // Sales slope
    const sumYSales = ySales.reduce((a, b) => a + b, 0);
    const sumXYSales = xVals.reduce((sum, x, i) => sum + x * ySales[i], 0);
    const slopeSales = (n * sumXYSales - sumX * sumYSales) / (n * sumX2 - sumX * sumX);
    const interceptSales = (sumYSales - slopeSales * sumX) / n;

    // Profit slope
    const sumYProfit = yProfit.reduce((a, b) => a + b, 0);
    const sumXYProfit = xVals.reduce((sum, x, i) => sum + x * yProfit[i], 0);
    const slopeProfit = (n * sumXYProfit - sumX * sumYProfit) / (n * sumX2 - sumX * sumX);
    const interceptProfit = (sumYProfit - slopeProfit * sumX) / n;

    const lastDate = new Date(dailyData[dailyData.length - 1]._id);
    const forecast14Days = [];

    for (let i = 1; i <= 14; i++) {
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + i);
      const estSales = Math.max(0, Math.round(slopeSales * (n + i - 1) + interceptSales));
      const estProfit = Math.max(0, Math.round(slopeProfit * (n + i - 1) + interceptProfit));
      forecast14Days.push({
        date: nextDate.toISOString().split("T")[0],
        estimatedSales: estSales,
        estimatedProfit: estProfit,
        isPredicted: true,
      });
    }

    const reliabilityScore = Math.min(95, Math.max(60, 50 + n * 4));

    res.json({
      status: "success",
      historicalDays: n,
      reliabilityScore: `${reliabilityScore}% (Based on ${n} trading days)`,
      trendDirection: slopeSales >= 0 ? "Upward Momentum" : "Downward Trajectory",
      next7DaysProjectedSales: forecast14Days.slice(0, 7).reduce((a, b) => a + b.estimatedSales, 0),
      next14DaysForecast: forecast14Days,
    });
  } catch (err) {
    console.error("Predictions Error:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

export default router;
