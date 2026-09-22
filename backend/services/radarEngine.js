import mongoose from "mongoose";
import SalesCustomer from "../models/SalesCustomer.js";
import ProductMaster from "../models/ProductMaster.js";
import { getComparisonPeriods } from "./rootCauseEngine.js";

/**
 * Scan user's business data and generate deterministic Risks & Opportunities
 */
export async function scanBusinessRadar(userId) {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const periods = await getComparisonPeriods(userId);

  const risks = [];
  const opportunities = [];

  if (!periods) {
    return {
      status: "insufficient_data",
      risks: [],
      opportunities: [],
      stats: { totalRisks: 0, criticalRisks: 0, totalOpportunities: 0, highOpportunities: 0 },
    };
  }

  const { minDate, midDate, maxDate } = periods;

  // 1. Fetch period comparisons
  const [
    period1Summary,
    period2Summary,
    productBreakdown,
    regionBreakdown,
    customerBreakdown,
    productMasterList,
  ] = await Promise.all([
    SalesCustomer.aggregate([
      { $match: { userId: userObjectId, date: { $gte: minDate, $lt: midDate } } },
      {
        $group: {
          _id: null,
          sales: { $sum: "$totalAmount" },
          profit: { $sum: "$profitMargin" },
          orders: { $sum: 1 },
          quantity: { $sum: "$quantity" },
        },
      },
    ]),
    SalesCustomer.aggregate([
      { $match: { userId: userObjectId, date: { $gte: midDate, $lte: maxDate } } },
      {
        $group: {
          _id: null,
          sales: { $sum: "$totalAmount" },
          profit: { $sum: "$profitMargin" },
          orders: { $sum: 1 },
          quantity: { $sum: "$quantity" },
        },
      },
    ]),
    SalesCustomer.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: {
            productId: "$productId",
            productName: "$productName",
            period: { $cond: [{ $gte: ["$date", midDate] }, "current", "previous"] },
          },
          sales: { $sum: "$totalAmount" },
          profit: { $sum: "$profitMargin" },
          quantity: { $sum: "$quantity" },
        },
      },
    ]),
    SalesCustomer.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: {
            region: "$region",
            period: { $cond: [{ $gte: ["$date", midDate] }, "current", "previous"] },
          },
          sales: { $sum: "$totalAmount" },
          profit: { $sum: "$profitMargin" },
        },
      },
    ]),
    SalesCustomer.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: "$customerName",
          totalSpent: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
          lastPurchase: { $max: "$date" },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 15 },
    ]),
    ProductMaster.find({ userId: userObjectId }),
  ]);

  const p1 = period1Summary[0] || { sales: 0, profit: 0, orders: 0, quantity: 0 };
  const p2 = period2Summary[0] || { sales: 0, profit: 0, orders: 0, quantity: 0 };

  const prevSales = p1.sales;
  const currSales = p2.sales;
  const salesPct = prevSales > 0 ? ((currSales - prevSales) / prevSales) * 100 : 0;

  const prevProfit = p1.profit;
  const currProfit = p2.profit;
  const profitPct = prevProfit > 0 ? ((currProfit - prevProfit) / prevProfit) * 100 : 0;

  const prevMargin = prevSales > 0 ? (prevProfit / prevSales) * 100 : 0;
  const currMargin = currSales > 0 ? (currProfit / currSales) * 100 : 0;
  const marginDiff = currMargin - prevMargin;

  const prevAov = p1.orders > 0 ? p1.sales / p1.orders : 0;
  const currAov = p2.orders > 0 ? p2.sales / p2.orders : 0;
  const aovPct = prevAov > 0 ? ((currAov - prevAov) / prevAov) * 100 : 0;

  // --- 🔴 RISK RADAR DETECTION ---

  // 1. Overall Revenue Risk
  if (salesPct < -5) {
    const severity = salesPct < -20 ? "Critical" : salesPct < -10 ? "High" : "Medium";
    risks.push({
      id: "risk-overall-revenue",
      type: "revenue",
      title: `Overall Revenue Contraction (${salesPct.toFixed(1)}%)`,
      severity,
      metric: "Total Revenue",
      currentValue: `₹${currSales.toLocaleString("en-IN")}`,
      previousValue: `₹${prevSales.toLocaleString("en-IN")}`,
      percentChange: Math.round(salesPct * 10) / 10,
      affectedEntity: "Entire Business",
      evidence: `Revenue declined from ₹${prevSales.toLocaleString("en-IN")} to ₹${currSales.toLocaleString("en-IN")} (loss of ₹${Math.abs(currSales - prevSales).toLocaleString("en-IN")}).`,
      rootCause: "Decline in order volume or key product sales velocity across periods.",
      recommendedNextStep: "Simulate targeted price elasticity or promotional discounts to recover volume.",
      simulationPreset: { type: "demand_increase", target: "All Products", changePercent: 15 },
    });
  }

  // 2. Profit Margin Risk
  if (marginDiff < -3 || (currSales > 0 && currMargin < 12)) {
    const severity = marginDiff < -8 || currMargin < 8 ? "Critical" : "High";
    risks.push({
      id: "risk-profit-margin",
      type: "profit",
      title: `Gross Margin Deterioration (${marginDiff.toFixed(1)}% pts)`,
      severity,
      metric: "Profit Margin",
      currentValue: `${currMargin.toFixed(1)}%`,
      previousValue: `${prevMargin.toFixed(1)}%`,
      percentChange: Math.round(marginDiff * 10) / 10,
      affectedEntity: "Gross Profitability",
      evidence: `Gross profit margin fell from ${prevMargin.toFixed(1)}% down to ${currMargin.toFixed(1)}%. Current profit: ₹${currProfit.toLocaleString("en-IN")}.`,
      rootCause: "Lower selling prices, product mix shifting toward low-margin SKUs, or elevated cost prices.",
      recommendedNextStep: "Review product cost prices in Product Master or simulate a 5-10% price increase on key items.",
      simulationPreset: { type: "price_change", target: "All Products", changePercent: 7 },
    });
  }

  // 3. AOV Risk
  if (aovPct < -8) {
    risks.push({
      id: "risk-aov-drop",
      type: "revenue",
      title: `Average Order Value Decline (${aovPct.toFixed(1)}%)`,
      severity: aovPct < -18 ? "High" : "Medium",
      metric: "Average Order Value (AOV)",
      currentValue: `₹${Math.round(currAov).toLocaleString("en-IN")}`,
      previousValue: `₹${Math.round(prevAov).toLocaleString("en-IN")}`,
      percentChange: Math.round(aovPct * 10) / 10,
      affectedEntity: "Customer Basket Size",
      evidence: `Average transaction value dropped from ₹${Math.round(prevAov)} to ₹${Math.round(currAov)}.`,
      rootCause: "Customers purchasing fewer items per order or shifting to cheaper product variants.",
      recommendedNextStep: "Introduce bundle pricing or minimum order value discounts.",
      simulationPreset: { type: "demand_increase", target: "All Products", changePercent: 10 },
    });
  }

  // Process Product Data for Product-level Risks & Opportunities
  const productMap = {};
  productBreakdown.forEach((item) => {
    const pId = item._id.productId || item._id.productName;
    const name = item._id.productName || pId;
    const period = item._id.period;
    if (!productMap[pId]) {
      productMap[pId] = { id: pId, name, prevSales: 0, currSales: 0, prevQty: 0, currQty: 0, prevProfit: 0, currProfit: 0 };
    }
    if (period === "previous") {
      productMap[pId].prevSales = item.sales;
      productMap[pId].prevQty = item.quantity;
      productMap[pId].prevProfit = item.profit;
    } else {
      productMap[pId].currSales = item.sales;
      productMap[pId].currQty = item.quantity;
      productMap[pId].currProfit = item.profit;
    }
  });

  Object.values(productMap).forEach((p) => {
    const pSalesPct = p.prevSales > 0 ? ((p.currSales - p.prevSales) / p.prevSales) * 100 : 0;
    const pMargin = p.currSales > 0 ? (p.currProfit / p.currSales) * 100 : 0;
    const pRevenueShare = currSales > 0 ? (p.currSales / currSales) * 100 : 0;

    // Product Risk: Significant decline in sales
    if (p.prevSales > 500 && pSalesPct < -15) {
      const severity = pSalesPct < -30 ? "High" : "Medium";
      risks.push({
        id: `risk-product-${p.id}`,
        type: "product",
        title: `${p.name} Sales Drop (${pSalesPct.toFixed(1)}%)`,
        severity,
        metric: "Product Revenue",
        currentValue: `₹${p.currSales.toLocaleString("en-IN")}`,
        previousValue: `₹${p.prevSales.toLocaleString("en-IN")}`,
        percentChange: Math.round(pSalesPct * 10) / 10,
        affectedEntity: p.name,
        evidence: `Revenue dropped by ₹${(p.prevSales - p.currSales).toLocaleString("en-IN")} from ₹${p.prevSales.toLocaleString("en-IN")} to ₹${p.currSales.toLocaleString("en-IN")}.`,
        rootCause: `Demand drop in ${p.name}. Volume decreased from ${p.prevQty} to ${p.currQty} units.`,
        recommendedNextStep: `Simulate a 10% promotional discount or price adjustment for ${p.name}.`,
        simulationPreset: { type: "discount_change", target: p.name, changePercent: 10, productId: p.id },
      });
    }

    // Product Risk: High sales volume with razor-thin margin
    if (pRevenueShare > 15 && pMargin < 8 && p.currSales > 0) {
      risks.push({
        id: `risk-margin-${p.id}`,
        type: "profit",
        title: `${p.name} Thin Margin (${pMargin.toFixed(1)}%) on High Volume`,
        severity: "High",
        metric: "Product Margin",
        currentValue: `${pMargin.toFixed(1)}%`,
        previousValue: "N/A",
        percentChange: 0,
        affectedEntity: p.name,
        evidence: `${p.name} represents ${pRevenueShare.toFixed(1)}% of total revenue, but generates only ${pMargin.toFixed(1)}% margin.`,
        rootCause: "Cost price is high relative to the selling price.",
        recommendedNextStep: `Simulate a 5% to 8% price increase on ${p.name} to expand margin without sacrificing volume.`,
        simulationPreset: { type: "price_change", target: p.name, changePercent: 8, productId: p.id },
      });
    }

    // --- 🟢 OPPORTUNITY RADAR DETECTION ---

    // Opportunity 1: Fast-Growing Products
    if (p.currSales > 1000 && pSalesPct > 20) {
      opportunities.push({
        id: `opp-growth-${p.id}`,
        title: `High Growth Momentum in ${p.name} (+${pSalesPct.toFixed(1)}%)`,
        severity: pSalesPct > 40 ? "High" : "Medium",
        metric: "Revenue Growth",
        currentValue: `₹${p.currSales.toLocaleString("en-IN")}`,
        previousValue: `₹${p.prevSales.toLocaleString("en-IN")}`,
        percentChange: Math.round(pSalesPct * 10) / 10,
        affectedEntity: p.name,
        evidence: `Revenue surged from ₹${p.prevSales.toLocaleString("en-IN")} to ₹${p.currSales.toLocaleString("en-IN")} with a healthy ${pMargin.toFixed(1)}% margin.`,
        suggestedOpportunity: `Boost inventory allocation and marketing spend for ${p.name} to capture accelerating demand.`,
        simulationPreset: { type: "demand_increase", target: p.name, changePercent: 25, productId: p.id },
      });
    }

    // Opportunity 2: High-Margin Under-Promoted Products
    if (pMargin > 30 && pRevenueShare < 15 && p.currSales > 0) {
      opportunities.push({
        id: `opp-margin-${p.id}`,
        title: `High-Margin Expansion Opportunity: ${p.name} (${pMargin.toFixed(1)}% Margin)`,
        severity: "High",
        metric: "Profit Margin",
        currentValue: `${pMargin.toFixed(1)}%`,
        previousValue: `${pRevenueShare.toFixed(1)}% Share`,
        percentChange: Math.round(pMargin * 10) / 10,
        affectedEntity: p.name,
        evidence: `${p.name} delivers an outstanding ${pMargin.toFixed(1)}% profit margin, but only accounts for ${pRevenueShare.toFixed(1)}% of total sales.`,
        suggestedOpportunity: `Cross-sell or feature ${p.name} prominently on store promotions to drive higher net profit per order.`,
        simulationPreset: { type: "demand_increase", target: p.name, changePercent: 30, productId: p.id },
      });
    }
  });

  // Regional Risks & Opportunities
  const regionMap = {};
  regionBreakdown.forEach((item) => {
    const region = item._id.region || "Unspecified";
    const period = item._id.period;
    if (!regionMap[region]) regionMap[region] = { region, prevSales: 0, currSales: 0 };
    if (period === "previous") regionMap[region].prevSales = item.sales;
    else regionMap[region].currSales = item.sales;
  });

  Object.values(regionMap).forEach((r) => {
    const rSalesPct = r.prevSales > 0 ? ((r.currSales - r.prevSales) / r.prevSales) * 100 : 0;
    if (r.prevSales > 1000 && rSalesPct < -18) {
      risks.push({
        id: `risk-region-${r.region}`,
        type: "region",
        title: `${r.region} Market Contraction (${rSalesPct.toFixed(1)}%)`,
        severity: rSalesPct < -30 ? "High" : "Medium",
        metric: "Regional Revenue",
        currentValue: `₹${r.currSales.toLocaleString("en-IN")}`,
        previousValue: `₹${r.prevSales.toLocaleString("en-IN")}`,
        percentChange: Math.round(rSalesPct * 10) / 10,
        affectedEntity: r.region,
        evidence: `Sales in ${r.region} dropped from ₹${r.prevSales.toLocaleString("en-IN")} to ₹${r.currSales.toLocaleString("en-IN")}.`,
        rootCause: `Regional drop in buyer activity or localized delivery/logistics friction.`,
        recommendedNextStep: `Simulate localized marketing campaign in ${r.region}.`,
        simulationPreset: { type: "regional_growth", target: r.region, changePercent: 20 },
      });
    }

    if (r.currSales > 1000 && rSalesPct > 20) {
      opportunities.push({
        id: `opp-region-${r.region}`,
        title: `Rapid Territory Expansion: ${r.region} (+${rSalesPct.toFixed(1)}%)`,
        severity: "High",
        metric: "Regional Growth",
        currentValue: `₹${r.currSales.toLocaleString("en-IN")}`,
        previousValue: `₹${r.prevSales.toLocaleString("en-IN")}`,
        percentChange: Math.round(rSalesPct * 10) / 10,
        affectedEntity: r.region,
        evidence: `Sales in ${r.region} expanded by +${rSalesPct.toFixed(1)}% reaching ₹${r.currSales.toLocaleString("en-IN")}.`,
        suggestedOpportunity: `Double down on regional distribution channels and local ad campaigns in ${r.region}.`,
        simulationPreset: { type: "regional_growth", target: r.region, changePercent: 25 },
      });
    }
  });

  // Calculate Radar Stats
  const criticalRisks = risks.filter((r) => r.severity === "Critical").length;
  const highOpportunities = opportunities.filter((o) => o.severity === "High").length;

  return {
    status: "success",
    risks,
    opportunities,
    stats: {
      totalRisks: risks.length,
      criticalRisks,
      totalOpportunities: opportunities.length,
      highOpportunities,
    },
  };
}
