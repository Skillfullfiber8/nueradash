import { useState, useEffect } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import BusinessRadar from "../components/decision/BusinessRadar";
import RootCauseExplorer from "../components/decision/RootCauseExplorer";
import WhatIfSimulator from "../components/decision/WhatIfSimulator";
import ActionPlanner from "../components/decision/ActionPlanner";
import AskWhyModal from "../components/decision/AskWhyModal";
import { API_BASE_URL, getAuthHeaders } from "../config/api";

export default function DecisionCenter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "radar";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulatorPreset, setSimulatorPreset] = useState(null);
  const [askWhyOpen, setAskWhyOpen] = useState(false);
  const [askWhyMetric, setAskWhyMetric] = useState("Revenue");
  const navigate = useNavigate();

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
    const headers = getAuthHeaders();
    if (!headers) {
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/decision/overview`, { headers });
      setData(res.data);
    } catch (err) {
      console.error("Failed to load decision overview:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("token");
        navigate("/login");
      }
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
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-indigo-900/50 flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧠</span>
            <span className="text-xs uppercase font-bold tracking-widest text-indigo-400">
              Deterministic Decision Intelligence
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Decision Center & Business Radar</h1>
          <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
            Continuous diagnostic layer detecting anomalies, explaining root causes, forecasting multi-horizon trajectories, and simulating outcomes.
          </p>
        </div>

        <button
          onClick={fetchDecisionOverview}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600/60 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold border border-indigo-400/30 transition flex items-center gap-1.5 shadow"
        >
          <span>🔄</span> {loading ? "Scanning..." : "Re-scan Radar"}
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => handleTabChange("radar")}
          className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition flex items-center gap-1.5 ${
            activeTab === "radar"
              ? "bg-indigo-600 text-white shadow"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <span>📡</span> Business Radar
        </button>

        <button
          onClick={() => handleTabChange("rootcause")}
          className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition flex items-center gap-1.5 ${
            activeTab === "rootcause"
              ? "bg-indigo-600 text-white shadow"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <span>🔬</span> Root Cause Decomposition
        </button>

        <button
          onClick={() => handleTabChange("simulator")}
          className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition flex items-center gap-1.5 ${
            activeTab === "simulator"
              ? "bg-indigo-600 text-white shadow"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <span>🧪</span> What-If Sandbox Simulator
        </button>

        <button
          onClick={() => handleTabChange("actions")}
          className={`px-5 py-2.5 rounded-xl font-semibold text-xs transition flex items-center gap-1.5 ${
            activeTab === "actions"
              ? "bg-indigo-600 text-white shadow"
              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <span>📋</span> Strategic Action Planner
        </button>
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700/60 p-12 text-center">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Executing Decision Diagnostics...</p>
          <p className="text-xs text-gray-400 mt-1">Analyzing transactions, driver decomposition, and elasticity simulation.</p>
        </div>
      ) : (
        <div>
          {activeTab === "radar" && (
            <BusinessRadar
              radarData={data?.radar}
              onSelectSimulate={handleSelectSimulate}
              onGoToActions={() => handleTabChange("actions")}
            />
          )}

          {activeTab === "rootcause" && (
            <RootCauseExplorer
              initialData={data?.rootCause}
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
        </div>
      )}

      {/* Ask Why Modal */}
      <AskWhyModal
        isOpen={askWhyOpen}
        onClose={() => setAskWhyOpen(false)}
        metricName={askWhyMetric}
        onSelectSimulate={handleSelectSimulate}
      />
    </div>
  );
}
