dotenv.config();
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import uploadRoutes from "./routes/uploadRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import salesStandardizedRoute from "./routes/salesStandardized.route.js";
import insightsRoutes from "./routes/insights.route.js";
import authRoutes from "./routes/authRoutes.js";
import productMasterRoutes from "./routes/productMaster.js";
import smartImportRoutes from "./routes/smartImport.js";




const app = express();

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    // Allow localhost
    if (origin.includes("localhost")) {
      return callback(null, true);
    }

    // Allow ALL Vercel deployments
    if (origin.includes("vercel.app")) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.options("*", cors());

app.use(express.json());


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err));

app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/products", productRoutes);
app.use("/api/upload", salesStandardizedRoute);
app.use("/api/insights", insightsRoutes);
app.use("/api/product-master", productMasterRoutes);
app.use("/api/smart-import", smartImportRoutes);  

app.get("/", (req, res) => {
  res.send("✅ Nueradash Backend Running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));