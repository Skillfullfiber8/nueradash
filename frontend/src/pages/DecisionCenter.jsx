import { useState, useEffect } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
import BusinessRadar from "../components/decision/BusinessRadar";
import RootCauseExplorer from "../components/decision/RootCauseExplorer";
import WhatIfSimulator from "../components/decision/WhatIfSimulator";
import ActionPlanner from "../components/decision/ActionPlanner";
import AskWhyModal from "../components/decision/AskWhyModal";

const API = process.env.REACT_APP_API_URL;

export default function DecisionCenter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "radar";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulatorPreset, setSimulatorPreset] = useState(null);
  const [askWhyOpen, setAskWhyOpen] = useState(false);
  const [askWhyMetric, setAskWhyMetric] = useState("Revenue");

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchDecisionOverview();
  }, []);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["radar", "rootcause", "simulator", "actions"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const fetchDecisionOverview = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/decision/overview`, { headers });
      setData(res.data);
    } catch (err) {
      console.error("Failed to load decision overview:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleSelectSimulate = (preset) => {
    setSimulatorPreset(preset);
    handleTabChange("simulator");
  };

  const handleOpenAskWhy = (metricName) => {
    setAskWhyMetric(metricName || "Revenue");
    setAskWhyOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧠</span>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              AI Decision Intelligence Layer
            </h1>
            <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-semibold border border-indigo-200 dark:border-indigo-800">
              DETECT → EXPLAIN → PREDICTS → SIMULATES → RECOMMENDS
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Proactive intelligence converting live sales transactions into deterministic root-causes, sandbox simulations, and action plans.
          </p>
        </div>

        <button
          onClick={fetchDecisionOverview}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
        >
          <span>🔄</span> Re-scan Business Signals
        </button>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-gray-100 dark:bg-gray-800/80 rounded-2xl w-fit">
        <button
          onClick={() => handleTabChange("radar")}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
            activeTab === "radar"
              ? "bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <span>📡</span> Business Radar
          {data?.radar?.risks?.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          )}
        </button>

        <button
          onClick={() => handleTabChange("rootcause")}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
            activeTab === "rootcause"
              ? "bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <span>🔬</span> Root Cause Explorer
        </button>

        <button
          onClick={() => handleTabChange("simulator")}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
            activeTab === "simulator"
              ? "bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <span>🧪</span> What-If Simulator
        </button>

        <button
          onClick={() => handleTabChange("actions")}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
            activeTab === "actions"
              ? "bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <span>📋</span> AI Action Planner
          {data?.actionPlan?.actions?.length > 0 && (
            <span className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
              {data.actionPlan.actions.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div className="py-24 text-center space-y-3 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700">
          <div className="inline-block w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-gray-500">Scanning Decision Intelligence Layer...</p>
        </div>
      ) : (
        <>
          {activeTab === "radar" && (
            <BusinessRadar
              radarData={data?.radar}
              onSelectSimulate={handleSelectSimulate}
              onAskWhy={handleOpenAskWhy}
              onGoToActions={() => handleTabChange("actions")}
            />
          )}

          {activeTab === "rootcause" && (
            <RootCauseExplorer
              rootCauseData={data?.rootCause}
              onSelectSimulate={handleSelectSimulate}
            />
          )}

          {activeTab === "simulator" && (
            <WhatIfSimulator
              presetConfig={simulatorPreset}
              products={data?.products || []}
              onGoToActions={() => handleTabChange("actions")}
            />
          )}

          {activeTab === "actions" && (
            <ActionPlanner
              actionPlanData={data?.actionPlan}
              onSelectSimulate={handleSelectSimulate}
            />
          )}
        </>
      )}

      {/* Global Ask Why Modal */}
      <AskWhyModal
        isOpen={askWhyOpen}
        onClose={() => setAskWhyOpen(false)}
        metricName={askWhyMetric}
        onSelectSimulate={handleSelectSimulate}
      />
    </div>
  );
}
