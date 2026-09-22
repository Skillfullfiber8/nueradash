import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL, getAuthHeaders } from "../../config/api";

export default function AskWhyModal({ isOpen, onClose, metricName = "Revenue", onSelectSimulate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("products");

  useEffect(() => {
    if (isOpen) {
      fetchRootCause();
    }
  }, [isOpen, metricName]);

  const fetchRootCause = async () => {
    const headers = getAuthHeaders();
    if (!headers) return;

    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/decision/root-cause`, {
        headers,
      });
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch root cause:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-5 text-white flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🔬</span>
              <h2 className="text-xl font-bold">Root Cause Analysis</h2>
            </div>
            <p className="text-indigo-100 text-xs mt-1">
              Deterministic period-over-period breakdown explaining changes in {metricName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-bold transition"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-12 text-center text-gray-400">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs">Decomposing mathematical sales drivers...</p>
            </div>
          ) : data?.status === "insufficient_data" ? (
            <div className="p-8 text-center text-gray-400">
              <p className="text-sm font-semibold">{data.message}</p>
            </div>
          ) : (
            <>
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-50 dark:bg-gray-800/60 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Revenue Shift</p>
                  <p className="text-base font-bold text-gray-800 dark:text-white mt-0.5">
                    {data?.summary?.revenueDelta >= 0 ? "+" : ""}₹{data?.summary?.revenueDelta?.toLocaleString("en-IN")}
                  </p>
                  <span className={`text-[10px] font-bold ${data?.summary?.revenuePercentChange >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                    {data?.summary?.revenuePercentChange >= 0 ? "+" : ""}{data?.summary?.revenuePercentChange}%
                  </span>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/60 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Profit Shift</p>
                  <p className="text-base font-bold text-gray-800 dark:text-white mt-0.5">
                    {data?.summary?.profitDelta >= 0 ? "+" : ""}₹{data?.summary?.profitDelta?.toLocaleString("en-IN")}
                  </p>
                  <span className={`text-[10px] font-bold ${data?.summary?.profitPercentChange >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                    {data?.summary?.profitPercentChange >= 0 ? "+" : ""}{data?.summary?.profitPercentChange}%
                  </span>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/60 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <p className="text-[10px] uppercase font-bold text-gray-400">Volume Shift</p>
                  <p className="text-base font-bold text-gray-800 dark:text-white mt-0.5">
                    {data?.summary?.currentOrders - data?.summary?.previousOrders >= 0 ? "+" : ""}{data?.summary?.currentOrders - data?.summary?.previousOrders} Orders
                  </p>
                  <span className="text-[10px] font-bold text-indigo-500">
                    {data?.summary?.ordersPercentChange}%
                  </span>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/60 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <p className="text-[10px] uppercase font-bold text-gray-400">AOV Shift</p>
                  <p className="text-base font-bold text-gray-800 dark:text-white mt-0.5">
                    {data?.summary?.currentAov - data?.summary?.previousAov >= 0 ? "+" : ""}₹{data?.summary?.currentAov - data?.summary?.previousAov}
                  </p>
                  <span className="text-[10px] font-bold text-indigo-500">
                    {data?.summary?.aovPercentChange}%
                  </span>
                </div>
              </div>

              {/* AI Explanation Box */}
              {data?.aiExplanation && (
                <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl">
                  <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5 mb-1">
                    <span>💡</span> Executive Synthesis
                  </p>
                  <p className="text-xs text-indigo-950 dark:text-indigo-300 leading-relaxed">
                    {data.aiExplanation}
                  </p>
                </div>
              )}

              {/* Contributor Breakdown Tabs */}
              <div>
                <div className="flex border-b border-gray-200 dark:border-gray-800 gap-4 mb-4">
                  <button
                    onClick={() => setActiveTab("products")}
                    className={`pb-2 text-xs font-bold transition border-b-2 ${
                      activeTab === "products"
                        ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Product Contributors ({data?.contributors?.products?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab("regions")}
                    className={`pb-2 text-xs font-bold transition border-b-2 ${
                      activeTab === "regions"
                        ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Regional Drivers ({data?.contributors?.regions?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab("categories")}
                    className={`pb-2 text-xs font-bold transition border-b-2 ${
                      activeTab === "categories"
                        ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Category Breakdown ({data?.contributors?.categories?.length || 0})
                  </button>
                </div>

                <div className="space-y-2">
                  {(data?.contributors?.[activeTab] || []).slice(0, 6).map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs"
                    >
                      <div>
                        <p className="font-bold text-gray-800 dark:text-gray-200">{item.name}</p>
                        <p className="text-[10px] text-gray-400">
                          Baseline: ₹{item.prevSales?.toLocaleString("en-IN") || 0} → Current: ₹{item.currSales?.toLocaleString("en-IN") || 0}
                        </p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-bold font-mono ${
                            item.deltaSales >= 0 ? "text-emerald-500" : "text-rose-500"
                          }`}
                        >
                          {item.deltaSales >= 0 ? "+" : ""}₹{item.deltaSales?.toLocaleString("en-IN")}
                        </span>
                        <p className="text-[10px] text-gray-400">
                          {item.pctChange > 0 ? "+" : ""}{item.pctChange}% ({item.impactShare}% share)
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 dark:bg-gray-800/80 px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <p className="text-[11px] text-gray-400">
            Compare Period: {data?.periods?.previous?.label} vs {data?.periods?.current?.label}
          </p>
          <div className="flex gap-2">
            {onSelectSimulate && (
              <button
                onClick={() => {
                  onClose();
                  onSelectSimulate({ type: "price_change" });
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
              >
                <span>🧪</span> Simulate Fix
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
