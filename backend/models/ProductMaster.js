import mongoose from "mongoose";

const ProductMasterSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  productId: String,
  productName: String,
  category: String,
  costPrice: Number,
  sellingPrice: Number,
});

export default mongoose.model("ProductMaster", ProductMasterSchema);