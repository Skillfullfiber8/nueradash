import mongoose from "mongoose";

const ProductMasterSchema = new mongoose.Schema({
  productId: String,
  productName: String,
  category: String,
  costPrice: Number,
  sellingPrice: Number,
});

export default mongoose.model("ProductMaster", ProductMasterSchema);