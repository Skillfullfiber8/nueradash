import mongoose from "mongoose";

const SalesSchema = new mongoose.Schema(
  {
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
    costPrice: Number,
    sellingPrice: Number,
    profitMargin: Number, // ✅ ensure this exists
    date: Date,
    location: String,
    paymentMethod: String
  },
  { timestamps: true }
);

export default mongoose.model("Sales", SalesSchema);
