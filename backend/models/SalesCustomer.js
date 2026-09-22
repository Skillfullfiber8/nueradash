import mongoose from "mongoose";

const SalesCustomerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  saleId: String,
  customerName: String,
  region: String,
  email: String,
  phone: String,
  productId: String,
  productName: String,
  category: String,
  quantity: Number,
  price: Number,
  totalAmount: Number,
  date: Date,
  location: String,
  paymentMethod: String,
  costPrice: Number,
  sellingPrice: Number,
  profitMargin: Number,
});

export default mongoose.model("SalesCustomer", SalesCustomerSchema, "sales");