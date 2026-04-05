import mongoose from "mongoose";

const AiSummarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  summary: String,
  generatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("AiSummary", AiSummarySchema);