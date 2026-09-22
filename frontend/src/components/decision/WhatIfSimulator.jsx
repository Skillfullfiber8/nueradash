import { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const API = process.env.REACT_APP_API_URL;

export default function WhatIfSimulator({ presetConfig, products = [], onGoToActions }) {
  const [scenarioType, setScenarioType] = useState("price_change");
  const [targetType, setTargetType] = useState("all");
  const [targetValue, setTargetValue] = useState("All Products");
  const [percentageChange, setPercentageChange] = useState(10);
  const [elasticity, setElasticity] = useState(1.2);
  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");

  // Apply preset if passed from Radar or Action Planner
  useEffect(() => {
    if (presetConfig) {
      if (presetConfig.type) setScenarioType(presetConfig.type);
      if (presetConfig.productId) {
        setTargetType("product");
        setTargetValue(presetConfig.productId);
      } else if (presetConfig.target) {
        if (presetConfig.type === "regional_growth") {
          setTargetType("region");
        }
        setTargetValue(presetConfig.target);
      }
      if (presetConfig.changePercent !== undefined) {
        setPercentageChange(presetConfig.changePercent);
      }
    }
  }, [presetConfig]);

  // Run simulation on mount or when trigger changes
  useEffect(() => {
    executeSimulation();
  }, [scenarioType, targetType, targetValue, percentageChange, elasticity]);

  const executeSimulation = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${API}/api/decision/simulate`,
        {
          scenarioType,
          targetType,
          targetValue,
          percentageChange: Number(percentageChange),
          elasticity: Number(elasticity),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSimResult(res.data);
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const scenarios = [
    { id: "price_change", label: "🏷️ Price Adjustment", desc: "Adjust selling price & model elasticity" },
    { id: "discount_change", label: "🎟️ Promo Discount", desc: "Test discount & volume lift" },
    { id: "demand_change", label: "📈 Demand Shift", desc: "Simulate marketing/traffic increase" },
    { id: "regional_growth", label: "🗺️ Regional Surge", desc: "Model geographic expansion" },
    { id: "product_removal", label: "❌ Product Removal", desc: "Test sunsetting an underperforming SKU" },
  ];

  const chartData = simResult?.status === "success" ? [
    {
      metric: "Revenue (₹)",
      Current: simResult.current.revenue,
      Simulated: simResult.simulated.revenue,
    },
    {
      metric: "Gross Profit (₹)",
      Current: simResult.current.profit,
      Simulated: simResult.simulated.profit,
    },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Sandbox Header */}
      <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-600 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🧪</span>
          <h2 className="text-2xl font-bold">What-If Business Simulator</h2>
          <span className="bg-white/20 text-xs px-3 py-1 rounded-full font-mono">100% In-Memory Sandbox</span>
        </div>
        <p className="text-indigo-100 text-sm max-w-2xl">
          Test strategic decisions in real-time without modifying your database. Model price elasticity, promotional discounts, demand shifts, and portfolio changes before committing.
        </p>
      </div>

      {/* Scenario Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {scenarios.map((sc) => (
          <button
            key={sc.id}
            onClick={() => {
              setScenarioType(sc.id);
              if (sc.id === "regional_growth") {
                setTargetType("region");
              } else if (sc.id === "product_removal") {
                setTargetType("product");
              }
            }}
            className={`p-3 rounded-2xl text-left border transition ${
              scenarioType === sc.id
                ? "bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-400/50"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700"
            }`}
          >
            <p className="font-bold text-xs">{sc.label}</p>
            <p className={`text-[10px] mt-0.5 ${scenarioType === sc.id ? "text-indigo-100" : "text-gray-400"}`}>
              {sc.desc}
            </p>
          </button>
        ))}
      </div>

      {/* Control Knobs & Input Card */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Target Selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">
              Target Entity
            </label>
            <select
              value={targetValue}
              onChange={(e) => {
                const val = e.target.value;
                setTargetValue(val);
                if (val === "All Products") setTargetType("all");
                else setTargetType("product");
              }}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All Products">All Products (Global Store)</option>
              {products.map((p) => (
                <option key={p.id} value={p.id || p.name}>
                  Product: {p.name || p.id}
                </option>
              ))}
            </select>
          </div>

          {/* Percentage Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                {scenarioType === "discount_change" ? "Discount Rate" : "Adjustment Factor"}
              </label>
              <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400 font-mono">
                {percentageChange > 0 ? `+${percentageChange}%` : `${percentageChange}%`}
              </span>
            </div>
            <input
              type="range"
              min={scenarioType === "discount_change" ? "0" : "-50"}
              max="50"
              step="1"
              value={percentageChange}
              onChange={(e) => setPercentageChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
              <span>{scenarioType === "discount_change" ? "0%" : "-50%"}</span>
              <span>0%</span>
              <span>+50%</span>
            </div>
          </div>

          {/* Elasticity Control */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                Price Elasticity Coefficient (e)
              </label>
              <span className="font-bold text-sm text-gray-700 dark:text-gray-300 font-mono">
                {elasticity}
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={elasticity}
              onChange={(e) => setElasticity(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-violet-600"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>0.5 (Inelastic)</span>
              <span>1.2 (Standard)</span>
              <span>2.5 (Highly Elastic)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Simulation Results Section */}
      {loading ? (
        <div className="py-16 text-center space-y-3 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700">
          <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">Recalculating simulation sandbox...</p>
        </div>
      ) : simResult?.status === "insufficient_data" ? (
        <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 text-gray-500">
          <p className="text-3xl mb-2">📊</p>
          <p className="text-sm font-medium">{simResult.message}</p>
        </div>
      ) : simResult?.status === "success" && (
        <div className="space-y-6">
          {/* Comparison KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Revenue */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Revenue</p>
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    ₹{simResult.simulated.revenue.toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-gray-400">
                    Baseline: ₹{simResult.current.revenue.toLocaleString("en-IN")}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-lg ${
                    simResult.delta.revenue >= 0
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                  }`}
                >
                  {simResult.delta.revenue >= 0 ? "+" : ""}
                  {simResult.delta.revenuePercent}%
                </span>
              </div>
            </div>

            {/* Profit */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">Gross Profit</p>
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                    ₹{simResult.simulated.profit.toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-gray-400">
                    Baseline: ₹{simResult.current.profit.toLocaleString("en-IN")}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-lg ${
                    simResult.delta.profit >= 0
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                  }`}
                >
                  {simResult.delta.profit >= 0 ? "+" : ""}
                  {simResult.delta.profitPercent}%
                </span>
              </div>
            </div>

            {/* Margin % */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">Profit Margin</p>
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    {simResult.simulated.margin}%
                  </p>
                  <p className="text-xs text-gray-400">
                    Baseline: {simResult.current.margin}%
                  </p>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-lg ${
                    simResult.delta.marginPercentDiff >= 0
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                  }`}
                >
                  {simResult.delta.marginPercentDiff >= 0 ? "+" : ""}
                  {simResult.delta.marginPercentDiff}% pts
                </span>
              </div>
            </div>

            {/* Units Volume */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Units Sold</p>
              <div className="flex items-baseline justify-between">
                <div>
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    {simResult.simulated.units.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">
                    Baseline: {simResult.current.units.toLocaleString()}
                  </p>
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                  {simResult.delta.units >= 0 ? `+${simResult.delta.units}` : simResult.delta.units} units
                </span>
              </div>
            </div>
          </div>

          {/* AI Strategic Assessment Callout */}
          <div className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/40 border border-indigo-200/80 dark:border-indigo-800/60 rounded-3xl p-5 flex items-start gap-4">
            <span className="text-2xl">🤖</span>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300">
                AI Strategic Feasibility Assessment
              </h4>
              <p className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed">
                {simResult.strategicAssessment}
              </p>
            </div>
          </div>

          {/* Side-by-Side Chart Comparison */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4">
              Baseline vs. Simulated Performance Comparison
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="metric" tick={{ fill: "#888", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#888", fontSize: 12 }} />
                  <Tooltip
                    formatter={(val) => `₹${Number(val).toLocaleString("en-IN")}`}
                    contentStyle={{ backgroundColor: "#1e1b4b", borderRadius: "12px", border: "none", color: "#fff" }}
                  />
                  <Legend />
                  <Bar dataKey="Current" fill="#94a3b8" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Simulated" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
