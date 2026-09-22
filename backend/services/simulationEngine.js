import mongoose from "mongoose";
import SalesCustomer from "../models/SalesCustomer.js";
import ProductMaster from "../models/ProductMaster.js";
import { generateText } from "./aiService.js";

/**
 * Execute What-If Business Simulation Sandbox
 * (100% in-memory sandbox calculations — read-only, never modifies DB)
 */
export async function runSimulation(userId, config = {}) {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const {
    scenarioType = "price_change", // "price_change" | "discount_change" | "demand_change" | "regional_growth" | "product_removal"
    targetType = "product",         // "product" | "category" | "region" | "all"
    targetValue = "All",           // specific name / ID or "All"
    percentageChange = 0,          // e.g. +10, -15
    elasticity = 1.2,              // price elasticity of demand
  } = config;

  // Fetch all transactions and product master data for the user
  const [transactions, productMaster] = await Promise.all([
    SalesCustomer.find({ userId: userObjectId }),
    ProductMaster.find({ userId: userObjectId }),
  ]);

  if (!transactions.length) {
    return {
      status: "insufficient_data",
      message: "No sales records available to run simulation. Please upload transactions first.",
    };
  }

  // Build product cost map
  const productCostMap = {};
  productMaster.forEach((p) => {
    productCostMap[p.productId] = Number(p.costPrice) || 0;
    if (p.productName) productCostMap[p.productName] = Number(p.costPrice) || 0;
  });

  // Calculate Baseline (Current) Metrics
  let currentRevenue = 0;
  let currentCost = 0;
  let currentProfit = 0;
  let currentUnits = 0;
  let currentOrders = transactions.length;

  transactions.forEach((tx) => {
    const qty = Number(tx.quantity) || 1;
    const price = Number(tx.price) || (Number(tx.totalAmount) / qty) || 0;
    const cost = Number(tx.costPrice) || productCostMap[tx.productId] || productCostMap[tx.productName] || 0;
    const totalAmount = Number(tx.totalAmount) || (qty * price);
    const profit = Number(tx.profitMargin) !== undefined && !isNaN(Number(tx.profitMargin))
      ? Number(tx.profitMargin)
      : (price - cost) * qty;

    currentRevenue += totalAmount;
    currentCost += (cost * qty);
    currentProfit += profit;
    currentUnits += qty;
  });

  const currentMargin = currentRevenue > 0 ? (currentProfit / currentRevenue) * 100 : 0;

  // Calculate Simulated Metrics
  let simRevenue = 0;
  let simCost = 0;
  let simProfit = 0;
  let simUnits = 0;
  let simOrders = 0;

  const pct = Number(percentageChange) || 0;
  const factor = pct / 100;

  transactions.forEach((tx) => {
    const qty = Number(tx.quantity) || 1;
    const price = Number(tx.price) || (Number(tx.totalAmount) / qty) || 0;
    const cost = Number(tx.costPrice) || productCostMap[tx.productId] || productCostMap[tx.productName] || 0;

    let applies = false;
    if (targetType === "all" || targetValue === "All" || targetValue === "All Products") {
      applies = true;
    } else if (targetType === "product") {
      applies = tx.productId === targetValue || tx.productName === targetValue;
    } else if (targetType === "region") {
      applies = tx.region === targetValue;
    } else if (targetType === "category") {
      applies = tx.category === targetValue;
    }

    let newQty = qty;
    let newPrice = price;

    if (applies) {
      switch (scenarioType) {
        case "price_change": {
          // Price changes by factor. Quantity shifts inversely based on price elasticity
          newPrice = Math.max(0, price * (1 + factor));
          const demandShift = -1 * factor * elasticity;
          newQty = Math.max(0, Math.round(qty * (1 + demandShift)));
          break;
        }
        case "discount_change": {
          // Discount reduces effective price, boosts quantity
          const discountRatio = Math.max(0, Math.min(0.9, Math.abs(factor)));
          newPrice = price * (1 - discountRatio);
          const demandBoost = discountRatio * elasticity;
          newQty = Math.max(0, Math.round(qty * (1 + demandBoost)));
          break;
        }
        case "demand_change": {
          // Pure demand increase/decrease
          newQty = Math.max(0, Math.round(qty * (1 + factor)));
          newPrice = price;
          break;
        }
        case "regional_growth": {
          // Regional expansion lifts volume
          newQty = Math.max(0, Math.round(qty * (1 + factor)));
          newPrice = price;
          break;
        }
        case "product_removal": {
          // Product removed entirely from portfolio
          newQty = 0;
          newPrice = 0;
          break;
        }
        default:
          break;
      }
    }

    if (newQty > 0) {
      const lineRevenue = newQty * newPrice;
      const lineCost = newQty * cost;
      const lineProfit = lineRevenue - lineCost;

      simRevenue += lineRevenue;
      simCost += lineCost;
      simProfit += lineProfit;
      simUnits += newQty;
      simOrders += 1;
    }
  });

  const simMargin = simRevenue > 0 ? (simProfit / simRevenue) * 100 : 0;

  // Calculate Net Changes
  const deltaRevenue = simRevenue - currentRevenue;
  const pctChangeRevenue = currentRevenue > 0 ? (deltaRevenue / currentRevenue) * 100 : 0;

  const deltaProfit = simProfit - currentProfit;
  const pctChangeProfit = currentProfit > 0 ? (deltaProfit / currentProfit) * 100 : 0;

  const deltaMargin = simMargin - currentMargin;
  const deltaUnits = simUnits - currentUnits;

  // Strategic AI Assessment
  let strategicAssessment = "";
  try {
    const prompt = `
You are a CFO strategic advisor. Provide a concise 2-sentence assessment of this What-If business simulation:
- Scenario: ${scenarioType.replace("_", " ").toUpperCase()} of ${pct}% on ${targetValue} (${targetType})
- Current: Revenue ₹${Math.round(currentRevenue).toLocaleString("en-IN")}, Profit ₹${Math.round(currentProfit).toLocaleString("en-IN")}, Margin ${currentMargin.toFixed(1)}%
- Simulated: Revenue ₹${Math.round(simRevenue).toLocaleString("en-IN")}, Profit ₹${Math.round(simProfit).toLocaleString("en-IN")}, Margin ${simMargin.toFixed(1)}%
- Net Impact: Revenue Δ ₹${Math.round(deltaRevenue).toLocaleString("en-IN")} (${pctChangeRevenue.toFixed(1)}%), Profit Δ ₹${Math.round(deltaProfit).toLocaleString("en-IN")} (${pctChangeProfit.toFixed(1)}%), Margin Δ ${deltaMargin.toFixed(1)}% pts.

Summarize if this decision is financially favorable or risky, and state the key tradeoff. Keep under 40 words, no markdown.
    `;

    strategicAssessment = await generateText({
      systemPrompt: "You are an executive business consultant giving concise financial advice.",
      userPrompt: prompt,
      temperature: 0.3,
      maxTokens: 150,
    });
  } catch (err) {
    strategicAssessment = deltaProfit >= 0
      ? `This simulation yields a net profit gain of +₹${Math.round(deltaProfit).toLocaleString("en-IN")} (${pctChangeProfit.toFixed(1)}%), representing a favorable business intervention.`
      : `This simulation results in a net profit reduction of -₹${Math.round(Math.abs(deltaProfit)).toLocaleString("en-IN")}. Exercise caution before executing.`;
  }

  return {
    status: "success",
    scenario: {
      scenarioType,
      targetType,
      targetValue,
      percentageChange: pct,
      elasticity,
    },
    current: {
      revenue: Math.round(currentRevenue),
      cost: Math.round(currentCost),
      profit: Math.round(currentProfit),
      margin: Math.round(currentMargin * 10) / 10,
      units: currentUnits,
      orders: currentOrders,
    },
    simulated: {
      revenue: Math.round(simRevenue),
      cost: Math.round(simCost),
      profit: Math.round(simProfit),
      margin: Math.round(simMargin * 10) / 10,
      units: simUnits,
      orders: simOrders,
    },
    delta: {
      revenue: Math.round(deltaRevenue),
      revenuePercent: Math.round(pctChangeRevenue * 10) / 10,
      profit: Math.round(deltaProfit),
      profitPercent: Math.round(pctChangeProfit * 10) / 10,
      marginPercentDiff: Math.round(deltaMargin * 10) / 10,
      units: deltaUnits,
    },
    strategicAssessment,
  };
}
