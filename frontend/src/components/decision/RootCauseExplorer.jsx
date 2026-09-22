import { useState } from "react";

export default function RootCauseExplorer({ rootCauseData, onSelectSimulate }) {
  const [activeTab, setActiveTab] = useState("products");

  if (!rootCauseData || rootCauseData.status === "insufficient_data") {
    return (
      <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-500">
        <p className="text-3xl mb-2">🔬</p>
        <h3 className="font-semibold text-gray-800 dark:text-gray-200">Insufficient Comparison Data</h3>
        <p className="text-xs mt-1">Upload at least two separate transaction days or periods to enable multi-dimensional root cause decomposition.</p>
      </div>
    );
  }

  const { summary, contributors, aiExplanation } = rootCauseData;
  const currentList = contributors?.[activeTab] || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🔬</span>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                Multi-Dimensional Root Cause Engine
              </h2>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Calculates exact contributor shares and isolates primary drivers behind revenue & profit shifts.
            </p>
          </div>

          <div className="flex gap-2">
            <span className="text-xs bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-xl font-medium border border-indigo-200 dark:border-indigo-800">
              📅 Baseline vs Current Window
            </span>
          </div>
        </div>

        {/* Period Delta Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
          <div>
            <p className="text-xs text-gray-400">Revenue Shift</p>
            <p className={`text-base font-bold ${summary.revenueDelta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {summary.revenueDelta >= 0 ? "+" : ""}₹{summary.revenueDelta?.toLocaleString("en-IN")} ({summary.revenuePercentChange}%)
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-400">Profit Shift</p>
            <p className={`text-base font-bold ${summary.profitDelta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {summary.profitDelta >= 0 ? "+" : ""}₹{summary.profitDelta?.toLocaleString("en-IN")} ({summary.profitPercentChange}%)
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-400">AOV Shift</p>
            <p className="text-base font-bold text-gray-800 dark:text-gray-100">
              ₹{summary.currentAov?.toLocaleString("en-IN")} ({summary.aovPercentChange}%)
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-400">Total Order Volume</p>
            <p className="text-base font-bold text-gray-800 dark:text-gray-100">
              {summary.currentOrders} orders ({summary.ordersPercentChange}%)
            </p>
          </div>
        </div>

        {/* AI Root Cause Statement */}
        <div className="bg-gradient-to-r from-indigo-50/80 to-violet-50/80 dark:from-indigo-950/40 dark:to-violet-950/40 border border-indigo-200/80 dark:border-indigo-800/60 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div>
            <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider mb-1">
              Executive Root Cause Synthesis
            </p>
            <p className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed">
              {aiExplanation}
            </p>
          </div>
        </div>
      </div>

      {/* Breakdown Explorer Table */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-3">
          <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200">
            Decomposed Contributor Dimensions
          </h3>
          <div className="flex gap-1.5">
            {["products", "regions", "categories"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                  activeTab === tab
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-700 dark:text-gray-200 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4 rounded-l-xl">Entity Name</th>
                <th className="py-3 px-4">Baseline Revenue</th>
                <th className="py-3 px-4">Current Revenue</th>
                <th className="py-3 px-4">Absolute Delta</th>
                <th className="py-3 px-4">Relative Growth</th>
                <th className="py-3 px-4">Impact Share</th>
                <th className="py-3 px-4 rounded-r-xl text-right">Simulate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {currentList.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/30 transition">
                  <td className="py-3 px-4 font-semibold text-gray-800 dark:text-gray-100">
                    {item.name}
                  </td>
                  <td className="py-3 px-4">₹{item.prevSales?.toLocaleString("en-IN") || 0}</td>
                  <td className="py-3 px-4">₹{item.currSales?.toLocaleString("en-IN") || 0}</td>
                  <td
                    className={`py-3 px-4 font-bold ${
                      item.deltaSales >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {item.deltaSales >= 0 ? "+" : ""}₹{item.deltaSales?.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-md font-mono ${
                        item.pctChange >= 0
                          ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                          : "bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                      }`}
                    >
                      {item.pctChange >= 0 ? "+" : ""}{item.pctChange}%
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                    {item.impactShare}%
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() =>
                        onSelectSimulate &&
                        onSelectSimulate({
                          type: "demand_increase",
                          target: item.name,
                          changePercent: 15,
                        })
                      }
                      className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-[11px] font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900 transition"
                    >
                      🧪 Simulate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
