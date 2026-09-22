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
import { API_BASE_URL, getAuthHeaders } from "../../config/api";

export default function WhatIfSimulator({ presetConfig, products = [], onGoToActions }) {
  const [scenarioType, setScenarioType] = useState("price_change");
  const [targetType, setTargetType] = useState("all");
  const [targetValue, setTargetValue] = useState("All Products");
  const [percentageChange, setPercentageChange] = useState(10);
  const [elasticity, setElasticity] = useState(1.2);
  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading] = useState(false);

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
    const headers = getAuthHeaders();
    if (!headers) return;

    setLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/decision/simulate`,
        {
          scenarioType,
          targetType,
          targetValue,
          percentageChange: Number(percentageChange),
          elasticity: Number(elasticity),
        },
        { headers }
      );
      setSimResult(res.data);
    } catch (err) {
      console.error("Simulation Execution Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = simResult?.baseline
    ? [
        {
          metric: "Revenue",
          Baseline: simResult.baseline.revenue,
          Simulated: simResult.simulated.revenue,
        },
        {
          metric: "Profit",
          Baseline: simResult.baseline.profit,
          Simulated: simResult.simulated.profit,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/60 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <span>🧪</span> What-If Sandbox Simulator
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Read-only in-memory simulation engine. Test pricing adjustments, promotions, and portfolio shifts without altering historical database records.
            </p>
          </div>
          {simResult?.delta && (
            <span
              className={`px-3 py-1 rounded-xl text-xs font-bold ${
                simResult.delta.profit >= 0
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  : "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
              }`}
            >
              Net Profit Delta: {simResult.delta.profit >= 0 ? "+" : ""}₹
              {simResult.delta.profit.toLocaleString("en-IN")} ({simResult.delta.profitPercent}%)
            </span>
          )}
        </div>

        {/* Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700/50 mb-6">
          {/* Scenario Type */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
              Simulation Scenario
            </label>
            <select
              value={scenarioType}
              onChange={(e) => setScenarioType(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="price_change">Price Elasticity (Raise / Lower Price)</option>
              <option value="discount_campaign">Promotional Discount & Volume Boost</option>
              <option value="demand_shock">Demand Shock (Volume Shift)</option>
              <option value="regional_growth">Targeted Regional Expansion</option>
              <option value="discontinue_product">Prune Product Line (Discontinue)</option>
            </select>
          </div>

          {/* Scope / Target */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
              Target Scope
            </label>
            {scenarioType === "regional_growth" ? (
              <input
                type="text"
                placeholder="e.g. Maharashtra or North"
                value={targetValue}
                onChange={(e) => {
                  setTargetType("region");
                  setTargetValue(e.target.value);
                }}
                className="w-full text-xs px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-100"
              />
            ) : scenarioType === "discontinue_product" ? (
              <select
                value={targetValue}
                onChange={(e) => {
                  setTargetType("product");
                  setTargetValue(e.target.value);
                }}
                className="w-full text-xs font-semibold px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-100"
              >
                <option value="All">Select Product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.id})
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={targetType}
                onChange={(e) => {
                  setTargetType(e.target.value);
                  if (e.target.value === "all") setTargetValue("All Products");
                }}
                className="w-full text-xs font-semibold px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-800 dark:text-gray-100"
              >
                <option value="all">Entire Business Portfolio</option>
                <option value="product">Specific Product SKU</option>
              </select>
            )}
          </div>

          {/* Magnitude Slider */}
          <div>
            <div className="flex justify-between text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
              <span>Change Magnitude</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                {percentageChange > 0 ? "+" : ""}
                {percentageChange}%
              </span>
            </div>
            <input
              type="range"
              min="-50"
              max="50"
              step="1"
              value={percentageChange}
              onChange={(e) => setPercentageChange(Number(e.target.value))}
              className="w-full accent-indigo-600 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
            />
          </div>

          {/* Elasticity Factor */}
          <div>
            <div className="flex justify-between text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
              <span>Price Elasticity Coefficient</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                {elasticity}
              </span>
            </div>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.1"
              value={elasticity}
              onChange={(e) => setElasticity(Number(e.target.value))}
              className="w-full accent-indigo-600 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Results Container */}
        {simResult?.status === "insufficient_data" ? (
          <div className="p-8 text-center text-gray-400">
            <p className="text-sm font-semibold">{simResult.message}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* KPI Delta Cards */}
            <div className="space-y-3 lg:col-span-1 flex flex-col justify-between">
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Projected Revenue</p>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    ₹{simResult?.simulated?.revenue?.toLocaleString("en-IN") || 0}
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      simResult?.delta?.revenue >= 0 ? "text-emerald-500" : "text-rose-500"
                    }`}
                  >
                    {simResult?.delta?.revenue >= 0 ? "+" : ""}
                    {simResult?.delta?.revenuePercent}%
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Baseline: ₹{simResult?.baseline?.revenue?.toLocaleString("en-IN") || 0}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Projected Net Profit</p>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    ₹{simResult?.simulated?.profit?.toLocaleString("en-IN") || 0}
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      simResult?.delta?.profit >= 0 ? "text-emerald-500" : "text-rose-500"
                    }`}
                  >
                    {simResult?.delta?.profit >= 0 ? "+" : ""}
                    {simResult?.delta?.profitPercent}%
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Baseline: ₹{simResult?.baseline?.profit?.toLocaleString("en-IN") || 0}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Profit Margin</p>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {simResult?.simulated?.marginPercent}%
                  </span>
                  <span className="text-xs font-bold text-indigo-500">
                    Baseline: {simResult?.baseline?.marginPercent}%
                  </span>
                </div>
              </div>
            </div>

            {/* Side-by-Side Comparison Chart */}
            <div className="lg:col-span-2 bg-gray-50 dark:bg-gray-900/40 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Baseline vs. Simulated Outcome Comparison
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="metric" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(val) => [`₹${val.toLocaleString("en-IN")}`, ""]} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="Baseline" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Simulated" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* AI Synthesis Note */}
        {simResult?.aiSynthesis && (
          <div className="mt-6 p-4 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 rounded-2xl flex items-start gap-3">
            <span className="text-xl shrink-0">💡</span>
            <div className="text-xs space-y-1">
              <p className="font-bold text-indigo-900 dark:text-indigo-200">AI Simulation Verdict</p>
              <p className="text-indigo-800/90 dark:text-indigo-300/90 leading-relaxed">
                {simResult.aiSynthesis}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
