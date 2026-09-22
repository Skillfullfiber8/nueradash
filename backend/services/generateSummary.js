import { generateText } from "./aiService.js";
import mongoose from "mongoose";
import SalesCustomer from "../models/SalesCustomer.js";
import AiSummary from "../models/AiSummary.js";

export async function generateAndSaveSummary(userId) {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const [summary, topProducts, regions, categories, paymentMethods] = await Promise.all([
    SalesCustomer.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: null, totalSales: { $sum: "$totalAmount" }, totalProfit: { $sum: "$profitMargin" }, count: { $sum: 1 } } },
    ]),
    SalesCustomer.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: "$productName", totalRevenue: { $sum: "$totalAmount" } } },
      { $sort: { totalRevenue: -1 } }, { $limit: 3 },
    ]),
    SalesCustomer.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: "$region", totalSales: { $sum: "$totalAmount" } } },
      { $sort: { totalSales: -1 } }, { $limit: 3 },
    ]),
    SalesCustomer.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: "$category", totalSales: { $sum: "$totalAmount" } } },
      { $sort: { totalSales: -1 } },
    ]),
    SalesCustomer.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: "$paymentMethod", count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 1 },
    ]),
  ]);

  // If no transactions exist for the user, reset summary gracefully without making an AI API call
  if (!summary.length || !summary[0]?.count || summary[0].count === 0) {
    const defaultMsg = "No summary yet. Upload data to generate one.";
    await AiSummary.findOneAndUpdate(
      { userId: userObjectId },
      { summary: defaultMsg, generatedAt: new Date() },
      { upsert: true, new: true }
    );
    return defaultMsg;
  }

  const prompt = `
Based on the following sales data, write a concise 3-4 sentence business summary highlighting key insights, top performers, and one actionable recommendation.

Total Sales: ₹${summary[0]?.totalSales || 0}
Total Profit: ₹${summary[0]?.totalProfit || 0}
Total Orders: ${summary[0]?.count || 0}
Top Products: ${topProducts.map(p => `${p._id} (₹${p.totalRevenue})`).join(", ")}
Top Regions: ${regions.map(r => `${r._id} (₹${r.totalSales})`).join(", ")}
Top Categories: ${categories.map(c => `${c._id} (₹${c.totalSales})`).join(", ")}
Most Used Payment Method: ${paymentMethods[0]?._id || "N/A"}

Write a professional business summary in plain English. No bullet points, no markdown.
  `;

  console.log(`[AI_SUMMARY] Generating summary for user: ${userId}`);
  const summaryText = await generateText({
    systemPrompt: "You are a professional business analytics assistant. Write concise, insightful executive summaries.",
    userPrompt: prompt,
    temperature: 0.7,
    maxTokens: 300,
  });

  // Save or update in DB
  await AiSummary.findOneAndUpdate(
    { userId: userObjectId },
    { summary: summaryText, generatedAt: new Date() },
    { upsert: true, new: true }
  );

  return summaryText;
}