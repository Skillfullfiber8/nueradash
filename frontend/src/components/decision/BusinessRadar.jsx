import { useState } from "react";

export default function BusinessRadar({ radarData, onSelectSimulate, onAskWhy, onGoToActions }) {
  const [expandedId, setExpandedId] = useState(null);
  const [filterType, setFilterType] = useState("all"); // "all" | "risks" | "opportunities"

  const risks = radarData?.risks || [];
  const opportunities = radarData?.opportunities || [];

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getSeverityBadge = (severity, isOpportunity = false) => {
    if (isOpportunity) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
          ✨ {severity} Opportunity
        </span>
      );
    }
    switch (severity) {
      case "Critical":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse">
            🚨 Critical Risk
          </span>
        );
      case "High":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            ⚠️ High Risk
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            ℹ️ {severity} Risk
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 font-bold text-lg">
            🔴
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Risks</p>
            <p className="text-xl font-bold text-gray-800 dark:text-white">{risks.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 font-bold text-lg">
            🚨
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Critical Risks</p>
            <p className="text-xl font-bold text-rose-600 dark:text-rose-400">
              {risks.filter((r) => r.severity === "Critical").length}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-lg">
            🟢
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Opportunities</p>
            <p className="text-xl font-bold text-gray-800 dark:text-white">{opportunities.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-lg">
            ✨
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">High Upside</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {opportunities.filter((o) => o.severity === "High").length}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        <button
          onClick={() => setFilterType("all")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
            filterType === "all"
              ? "bg-indigo-600 text-white shadow"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          All Signals ({risks.length + opportunities.length})
        </button>
        <button
          onClick={() => setFilterType("risks")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
            filterType === "risks"
              ? "bg-rose-600 text-white shadow"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          🔴 Risks ({risks.length})
        </button>
        <button
          onClick={() => setFilterType("opportunities")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
            filterType === "opportunities"
              ? "bg-emerald-600 text-white shadow"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          🟢 Opportunities ({opportunities.length})
        </button>
      </div>

      {/* Radar Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RISKS COLUMN */}
        {(filterType === "all" || filterType === "risks") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <span>🔴</span> Detected Business Risks
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">{risks.length} active threats</span>
            </div>

            {risks.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-500">
                <p className="text-2xl mb-1">🛡️</p>
                <p className="text-sm font-medium">No active business risks detected.</p>
              </div>
            ) : (
              risks.map((risk) => {
                const isExpanded = expandedId === risk.id;
                return (
                  <div
                    key={risk.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/80 dark:border-gray-700 overflow-hidden transition hover:shadow-md"
                  >
                    <div
                      className="p-5 cursor-pointer flex justify-between items-start gap-3"
                      onClick={() => toggleExpand(risk.id)}
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getSeverityBadge(risk.severity, false)}
                          <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                            {risk.affectedEntity}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                          {risk.title}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                          {risk.evidence}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
                          {risk.currentValue}
                        </p>
                        <p className="text-xs text-gray-400">
                          {risk.percentChange !== 0 ? `${risk.percentChange}%` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Expanded 4-Step Flow */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-900/30 space-y-4 animate-fadeIn text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                            <p className="font-semibold text-gray-500 dark:text-gray-400 mb-1">
                              1. WHAT HAPPENED?
                            </p>
                            <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                              {risk.evidence}
                            </p>
                          </div>
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                            <p className="font-semibold text-gray-500 dark:text-gray-400 mb-1">2. WHY?</p>
                            <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                              {risk.rootCause}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                          <p className="font-semibold text-indigo-600 dark:text-indigo-400 mb-1">
                            3. RECOMMENDED ACTION (WHAT CAN I DO?)
                          </p>
                          <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                            {risk.recommendedNextStep}
                          </p>
                        </div>

                        {/* Connected Action Buttons */}
                        <div className="flex flex-wrap gap-2 pt-1 justify-end">
                          <button
                            onClick={() => onAskWhy && onAskWhy(risk.affectedEntity)}
                            className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition flex items-center gap-1"
                          >
                            <span>🔬</span> Ask Why
                          </button>
                          {risk.simulationPreset && (
                            <button
                              onClick={() => onSelectSimulate && onSelectSimulate(risk.simulationPreset)}
                              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition flex items-center gap-1 shadow-sm"
                            >
                              <span>🧪</span> Simulate Intervention →
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* OPPORTUNITIES COLUMN */}
        {(filterType === "all" || filterType === "opportunities") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <span>🟢</span> Growth Opportunities
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {opportunities.length} potential upsides
              </span>
            </div>

            {opportunities.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 text-gray-500">
                <p className="text-2xl mb-1">🌱</p>
                <p className="text-sm font-medium">No opportunities identified yet.</p>
              </div>
            ) : (
              opportunities.map((opp) => {
                const isExpanded = expandedId === opp.id;
                return (
                  <div
                    key={opp.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200/80 dark:border-gray-700 overflow-hidden transition hover:shadow-md"
                  >
                    <div
                      className="p-5 cursor-pointer flex justify-between items-start gap-3"
                      onClick={() => toggleExpand(opp.id)}
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getSeverityBadge(opp.severity, true)}
                          <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                            {opp.affectedEntity}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                          {opp.title}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                          {opp.evidence}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {opp.currentValue}
                        </p>
                        <p className="text-xs text-gray-400">
                          {opp.percentChange !== 0 ? `+${opp.percentChange}%` : ""}
                        </p>
                      </div>
                    </div>

                    {/* Expanded 4-Step Flow */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-900/30 space-y-4 animate-fadeIn text-xs">
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                          <p className="font-semibold text-gray-500 dark:text-gray-400 mb-1">
                            OPPORTUNITY EVIDENCE
                          </p>
                          <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                            {opp.evidence}
                          </p>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                          <p className="font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                            SUGGESTED STRATEGY (HOW TO CAPTURE)
                          </p>
                          <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                            {opp.suggestedOpportunity}
                          </p>
                        </div>

                        {/* Connected Action Buttons */}
                        <div className="flex flex-wrap gap-2 pt-1 justify-end">
                          {opp.simulationPreset && (
                            <button
                              onClick={() => onSelectSimulate && onSelectSimulate(opp.simulationPreset)}
                              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition flex items-center gap-1 shadow-sm"
                            >
                              <span>🧪</span> Simulate Growth Impact →
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
