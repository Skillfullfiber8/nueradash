import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import uploadRoutes from "./routes/uploadRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import salesStandardizedRoute from "./routes/salesStandardized.route.js";
import insightsRoutes from "./routes/insights.route.js";
import authRoutes from "./routes/authRoutes.js";
import productMasterRoutes from "./routes/productMaster.js";
import smartImportRoutes from "./routes/smartImport.js";
import decisionRoutes from "./routes/decision.route.js";

const app = express();

// Allowed Origins Configuration
const allowedOriginList = [
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173"
].filter(Boolean).map(url => url.replace(/\/$/, ""));

app.use(cors({
  origin: function (origin, callback) {
    // Allow non-browser requests (Postman, curl, server-to-server, mobile app)
    if (!origin) return callback(null, true);

    const cleanOrigin = origin.replace(/\/$/, "");

    // Direct match against configured origins
    if (allowedOriginList.includes(cleanOrigin)) {
      return callback(null, true);
    }

    // Pattern matching for typical deployment domains
    if (
      cleanOrigin.includes("localhost") ||
      cleanOrigin.includes("127.0.0.1") ||
      cleanOrigin.endsWith(".vercel.app") ||
      cleanOrigin.endsWith(".onrender.com") ||
      cleanOrigin.endsWith(".netlify.app") ||
      cleanOrigin.endsWith(".pages.dev")
    ) {
      return callback(null, true);
    }

    console.warn(`[CORS] Request blocked from origin: ${origin}`);
    return callback(new Error(`CORS error: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// MongoDB Connection with fallback
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!mongoUri) {
  console.error("❌ CRITICAL: No MongoDB connection string found. Please set MONGO_URI in your environment variables.");
} else {
  mongoose
    .connect(mongoUri)
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch((err) => console.error("❌ MongoDB Connection Error:", err.message));
}

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/products", productRoutes);
app.use("/api/upload", salesStandardizedRoute);
app.use("/api/insights", insightsRoutes);
app.use("/api/product-master", productMasterRoutes);
app.use("/api/smart-import", smartImportRoutes);
app.use("/api/decision", decisionRoutes);

app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "Nueradash Backend API is running",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    geminiConfigured: !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
    geminiModel: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    timestamp: new Date().toISOString()
  });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error(`[SERVER ERROR] ${req.method} ${req.url}:`, err.message || err);
  
  if (err.message && err.message.includes("CORS")) {
    return res.status(403).json({
      success: false,
      error: "CORS error: Request origin not allowed by backend CORS policy"
    });
  }

  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === "production" ? "Internal server error" : (err.message || "Unknown error")
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));