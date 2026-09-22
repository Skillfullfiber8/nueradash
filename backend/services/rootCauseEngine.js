import mongoose from "mongoose";
import SalesCustomer from "../models/SalesCustomer.js";
import { generateText } from "./aiService.js";

/**
 * Split user's sales data into two chronological comparison periods
 * (Current period vs Previous baseline period)
 */
export async function getComparisonPeriods(userId) {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  // Find date boundary
  const dateRange = await SalesCustomer.aggregate([
    { $match: { userId: userObjectId, date: { $ne: null } } },
    {
      $group: {
        _id: null,
        minDate: { $min: "$date" },
        maxDate: { $max: "$date" },
        count: { $sum: 1 },
      },
    },
  ]);

  if (!dateRange.length || dateRange[0].count < 2) {
    return null;
  }

  const { minDate, maxDate } = dateRange[0];
  const minTime = new Date(minDate).getTime();
  const maxTime = new Date(maxDate).getTime();

  // If min and max are the exact same day, create artificial split by order timestamp or ID
  const midpoint = minTime === maxTime ? minTime : minTime + (maxTime - minTime) / 2;
  const midDate = new Date(midpoint);

  return { minDate, midDate, maxDate };
}

/**
 * Execute Root Cause Analysis for a user's overall sales or specific focus metric
 */
export async function analyzeRootCauses(userId, focusMetric = "revenue") {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const periods = await getComparisonPeriods(userId);

  if (!periods) {
    return {
      status: "insufficient_data",
      message: "Not enough historical transaction data to perform Root Cause Analysis. Upload at least two sales records.",
      periods: null,
      summary: null,
      contributors: [],
      aiExplanation: "Insufficient historical data available for root cause breakdown.",
    };
  }

  const { minDate, midDate, maxDate } = periods;

  // Aggregate Period 1 (Baseline / Previous) and Period 2 (Current / Recent)
  const [period1Agg, period2Agg, productAgg, regionAgg, categoryAgg, cityAgg] = await Promise.all([
    // Period 1 Summary
    SalesCustomer.aggregate([
      { $match: { userId: userObjectId, date: { $gte: minDate, $lt: midDate } } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalAmount" },
          totalProfit: { $sum: "$profitMargin" },
          totalUnits: { $sum: "$quantity" },
          orders: { $sum: 1 },
        },
      },
    ]),
    // Period 2 Summary
    SalesCustomer.aggregate([
      { $match: { userId: userObjectId, date: { $gte: midDate, $lte: maxDate } } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalAmount" },
          totalProfit: { $sum: "$profitMargin" },
          totalUnits: { $sum: "$quantity" },
          orders: { $sum: 1 },
        },
      },
    ]),
    // Product breakdown per period
    SalesCustomer.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: {
            productName: { $ifNull: ["$productName", "Unknown Product"] },
            period: {
              $cond: [{ $gte: ["$date", midDate] }, "current", "previous"],
            },
          },
          sales: { $sum: "$totalAmount" },
          profit: { $sum: "$profitMargin" },
          units: { $sum: "$quantity" },
        },
      },
    ]),
    // Region breakdown per period
    SalesCustomer.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: {
            region: { $ifNull: ["$region", "Unspecified Region"] },
            period: {
              $cond: [{ $gte: ["$date", midDate] }, "current", "previous"],
            },
          },
          sales: { $sum: "$totalAmount" },
          profit: { $sum: "$profitMargin" },
          units: { $sum: "$quantity" },
        },
      },
    ]),
    // Category breakdown per period
    SalesCustomer.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: {
            category: { $ifNull: ["$category", "Unspecified Category"] },
            period: {
              $cond: [{ $gte: ["$date", midDate] }, "current", "previous"],
            },
          },
          sales: { $sum: "$totalAmount" },
          profit: { $sum: "$profitMargin" },
        },
      },
    ]),
    // City breakdown per period
    SalesCustomer.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: {
            city: { $ifNull: ["$location", "Unspecified City"] },
            period: {
              $cond: [{ $gte: ["$date", midDate] }, "current", "previous"],
            },
          },
          sales: { $sum: "$totalAmount" },
          profit: { $sum: "$profitMargin" },
        },
      },
    ]),
  ]);

  const p1 = period1Agg[0] || { totalSales: 0, totalProfit: 0, totalUnits: 0, orders: 0 };
  const p2 = period2Agg[0] || { totalSales: 0, totalProfit: 0, totalUnits: 0, orders: 0 };

  const prevSales = p1.totalSales;
  const currSales = p2.totalSales;
  const salesDelta = currSales - prevSales;
  const salesPercentChange = prevSales > 0 ? ((salesDelta / prevSales) * 100) : (currSales > 0 ? 100 : 0);

  const prevProfit = p1.totalProfit;
  const currProfit = p2.totalProfit;
  const profitDelta = currProfit - prevProfit;
  const profitPercentChange = prevProfit > 0 ? ((profitDelta / prevProfit) * 100) : (currProfit > 0 ? 100 : 0);

  const prevAov = p1.orders > 0 ? p1.totalSales / p1.orders : 0;
  const currAov = p2.orders > 0 ? p2.totalSales / p2.orders : 0;
  const aovDelta = currAov - prevAov;
  const aovPercentChange = prevAov > 0 ? ((aovDelta / prevAov) * 100) : 0;

  // Process Product Contributors
  const productMap = {};
  productAgg.forEach((item) => {
    const name = item._id.productName;
    const period = item._id.period;
    if (!productMap[name]) productMap[name] = { name, prevSales: 0, currSales: 0, prevProfit: 0, currProfit: 0 };
    if (period === "previous") {
      productMap[name].prevSales = item.sales;
      productMap[name].prevProfit = item.profit;
    } else {
      productMap[name].currSales = item.sales;
      productMap[name].currProfit = item.profit;
    }
  });

  const productBreakdown = Object.values(productMap).map((p) => {
    const deltaSales = p.currSales - p.prevSales;
    const deltaProfit = p.currProfit - p.prevProfit;
    const pctChange = p.prevSales > 0 ? ((deltaSales / p.prevSales) * 100) : (p.currSales > 0 ? 100 : 0);
    const revenueImpactShare = salesDelta !== 0 ? ((deltaSales / Math.abs(salesDelta)) * 100) : 0;
    return {
      dimension: "Product",
      name: p.name,
      prevSales: p.prevSales,
      currSales: p.currSales,
      deltaSales,
      deltaProfit,
      pctChange: Math.round(pctChange * 10) / 10,
      impactShare: Math.round(revenueImpactShare * 10) / 10,
    };
  }).sort((a, b) => Math.abs(b.deltaSales) - Math.abs(a.deltaSales));

  // Process Regional Contributors
  const regionMap = {};
  regionAgg.forEach((item) => {
    const name = item._id.region;
    const period = item._id.period;
    if (!regionMap[name]) regionMap[name] = { name, prevSales: 0, currSales: 0, prevProfit: 0, currProfit: 0 };
    if (period === "previous") {
      regionMap[name].prevSales = item.sales;
      regionMap[name].prevProfit = item.profit;
    } else {
      regionMap[name].currSales = item.sales;
      regionMap[name].currProfit = item.profit;
    }
  });

  const regionBreakdown = Object.values(regionMap).map((r) => {
    const deltaSales = r.currSales - r.prevSales;
    const pctChange = r.prevSales > 0 ? ((deltaSales / r.prevSales) * 100) : (r.currSales > 0 ? 100 : 0);
    const revenueImpactShare = salesDelta !== 0 ? ((deltaSales / Math.abs(salesDelta)) * 100) : 0;
    return {
      dimension: "Region",
      name: r.name,
      prevSales: r.prevSales,
      currSales: r.currSales,
      deltaSales,
      pctChange: Math.round(pctChange * 10) / 10,
      impactShare: Math.round(revenueImpactShare * 10) / 10,
    };
  }).sort((a, b) => Math.abs(b.deltaSales) - Math.abs(a.deltaSales));

  // Process Category Contributors
  const categoryMap = {};
  categoryAgg.forEach((item) => {
    const name = item._id.category;
    const period = item._id.period;
    if (!categoryMap[name]) categoryMap[name] = { name, prevSales: 0, currSales: 0 };
    if (period === "previous") categoryMap[name].prevSales = item.sales;
    else categoryMap[name].currSales = item.sales;
  });

  const categoryBreakdown = Object.values(categoryMap).map((c) => {
    const deltaSales = c.currSales - c.prevSales;
    const pctChange = c.prevSales > 0 ? ((deltaSales / c.prevSales) * 100) : (c.currSales > 0 ? 100 : 0);
    const revenueImpactShare = salesDelta !== 0 ? ((deltaSales / Math.abs(salesDelta)) * 100) : 0;
    return {
      dimension: "Category",
      name: c.name,
      prevSales: c.prevSales,
      currSales: c.currSales,
      deltaSales,
      pctChange: Math.round(pctChange * 10) / 10,
      impactShare: Math.round(revenueImpactShare * 10) / 10,
    };
  }).sort((a, b) => Math.abs(b.deltaSales) - Math.abs(a.deltaSales));

  // Determine top negative or positive drivers
  const topProductContributors = productBreakdown.slice(0, 4);
  const topRegionContributors = regionBreakdown.slice(0, 3);
  const topCategoryContributors = categoryBreakdown.slice(0, 3);

  // Generate AI Plain-English Root Cause Explanation strictly using calculated evidence
  let aiExplanation = "";
  try {
    const prompt = `
You are a root-cause business analytics expert. Explain WHY the business metric changed based ONLY on this calculated evidence:
- Overall Revenue: Previous ₹${prevSales}, Current ₹${currSales}, Delta ₹${salesDelta} (${salesPercentChange.toFixed(1)}%)
- Overall Profit: Previous ₹${prevProfit}, Current ₹${currProfit}, Delta ₹${profitDelta} (${profitPercentChange.toFixed(1)}%)
- AOV: Previous ₹${prevAov.toFixed(0)}, Current ₹${currAov.toFixed(0)} (${aovPercentChange.toFixed(1)}%)
- Top Product Changes: ${topProductContributors.map(p => `${p.name}: Δ ₹${p.deltaSales} (${p.pctChange}%, impact share: ${p.impactShare}%)`).join("; ")}
- Top Regional Changes: ${topRegionContributors.map(r => `${r.name}: Δ ₹${r.deltaSales} (${r.pctChange}%)`).join("; ")}
- Top Category Changes: ${topCategoryContributors.map(c => `${c.name}: Δ ₹${c.deltaSales} (${c.pctChange}%)`).join("; ")}

Write a concise 2-3 sentence executive explanation of the root cause in plain English. State the primary driver and contributing region/category. No markdown, no bullet points, use ₹ for currency.
    `;

    aiExplanation = await generateText({
      systemPrompt: "You are a deterministic financial analyst converting calculated evidence into concise business explanations.",
      userPrompt: prompt,
      temperature: 0.3,
      maxTokens: 250,
    });
  } catch (err) {
    aiExplanation = `Revenue changed by ${salesPercentChange.toFixed(1)}% (Δ ₹${salesDelta.toLocaleString("en-IN")}), with primary impact driven by ${topProductContributors[0]?.name || "top products"} and ${topRegionContributors[0]?.name || "key regions"}.`;
  }

  return {
    status: "success",
    periods: {
      previous: { start: minDate, end: midDate, label: "Baseline Period" },
      current: { start: midDate, end: maxDate, label: "Current Period" },
    },
    summary: {
      previousRevenue: prevSales,
      currentRevenue: currSales,
      revenueDelta: salesDelta,
      revenuePercentChange: Math.round(salesPercentChange * 10) / 10,
      previousProfit: prevProfit,
      currentProfit: currProfit,
      profitDelta,
      profitPercentChange: Math.round(profitPercentChange * 10) / 10,
      previousOrders: p1.orders,
      currentOrders: p2.orders,
      ordersPercentChange: p1.orders > 0 ? Math.round(((p2.orders - p1.orders) / p1.orders) * 1000) / 10 : 0,
      previousAov: Math.round(prevAov),
      currentAov: Math.round(currAov),
      aovPercentChange: Math.round(aovPercentChange * 10) / 10,
    },
    contributors: {
      products: productBreakdown,
      regions: regionBreakdown,
      categories: categoryBreakdown,
    },
    topDrivers: {
      products: topProductContributors,
      regions: topRegionContributors,
      categories: topCategoryContributors,
    },
    aiExplanation,
  };
}
