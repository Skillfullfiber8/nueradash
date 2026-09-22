import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = process.env.REACT_APP_API_URL;

export default function AskWhyModal({ isOpen, onClose, metricName = "Revenue", onSelectSimulate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("products");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (isOpen) {
      fetchRootCause();
    }
  }, [isOpen, metricName]);

  const fetchRootCause = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/decision/root-cause`, {
        headers: { Authorization: `Bearer ${token}` },
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
            <div className="py-16 text-center space-y-3">
              <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Decomposing multi-dimensional drivers...</p>
            </div>
          ) : !data || data.status === "insufficient_data" ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              <p className="text-3xl mb-2">📊</p>
              <p className="font-medium text-gray-700 dark:text-gray-300">Insufficient Data for Root Cause Decomposition</p>
              <p className="text-xs mt-1">Upload at least 2 distinct sales records to unlock period-over-period investigation.</p>
            </div>
          ) : (
            <>
              {/* Period Comparison Card */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700/60 text-center">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Previous Baseline</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    ₹{data.summary?.previousRevenue?.toLocaleString("en-IN") || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Current Period</p>
                  <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                    ₹{data.summary?.currentRevenue?.toLocaleString("en-IN") || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Net Delta</p>
                  <p
                    className={`text-lg font-bold ${
                      (data.summary?.revenueDelta || 0) >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {(data.summary?.revenueDelta || 0) >= 0 ? "+" : ""}
                    ₹{data.summary?.revenueDelta?.toLocaleString("en-IN") || 0} (
                    {data.summary?.revenuePercentChange}%)
                  </p>
                </div>
              </div>

              {/* AI Explanation Callout */}
              <div className="bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2 text-indigo-700 dark:text-indigo-300 font-semibold text-sm">
                  <span>🤖</span> AI Root Cause Explanation
                </div>
                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-200">
                  {data.aiExplanation}
                </p>
              </div>

              {/* Contributing Factors Tabs */}
              <div>
                <div className="flex items-center justify-between mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                    Contributing Factors Breakdown
                  </h3>
                  <div className="flex gap-1">
                    {["products", "regions", "categories"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition ${
                          activeTab === tab
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
                    <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 uppercase font-semibold">
                      <tr>
                        <th className="py-2.5 px-3 rounded-l-lg">Entity</th>
                        <th className="py-2.5 px-3">Baseline</th>
                        <th className="py-2.5 px-3">Current</th>
                        <th className="py-2.5 px-3">Delta</th>
                        <th className="py-2.5 px-3 rounded-r-lg">Impact Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {(data.contributors?.[activeTab] || []).slice(0, 5).map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                          <td className="py-2.5 px-3 font-medium text-gray-800 dark:text-gray-100">
                            {item.name}
                          </td>
                          <td className="py-2.5 px-3">₹{item.prevSales?.toLocaleString("en-IN") || 0}</td>
                          <td className="py-2.5 px-3">₹{item.currSales?.toLocaleString("en-IN") || 0}</td>
                          <td
                            className={`py-2.5 px-3 font-semibold ${
                              item.deltaSales >= 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {item.deltaSales >= 0 ? "+" : ""}₹{item.deltaSales?.toLocaleString("en-IN")} ({item.pctChange}%)
                          </td>
                          <td className="py-2.5 px-3 font-bold text-indigo-600 dark:text-indigo-400">
                            {item.impactShare}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions: Detect -> Explain -> Predict -> Simulate -> Recommend */}
        <div className="bg-gray-50 dark:bg-gray-800/80 px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex flex-wrap gap-2 justify-end">
          <button
            onClick={() => {
              onClose();
              navigate("/decision-center?tab=simulator");
            }}
            className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900 transition flex items-center gap-1.5"
          >
            <span>🧪</span> Test in Simulator
          </button>
          <button
            onClick={() => {
              onClose();
              navigate("/decision-center?tab=actions");
            }}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-xs font-semibold shadow hover:from-indigo-700 hover:to-violet-700 transition flex items-center gap-1.5"
          >
            <span>📋</span> View Action Plan →
          </button>
        </div>
      </div>
    </div>
  );
}
