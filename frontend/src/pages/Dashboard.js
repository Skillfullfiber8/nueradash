import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts";
import Chatbot from "../components/Chatbot";
import AskWhyModal from "../components/decision/AskWhyModal";

const COLORS = ["#6366f1", "#22d3ee", "#f59e0b", "#10b981", "#f43f5e", "#8b5cf6", "#ec4899"];
const API = process.env.REACT_APP_API_URL;

function StatCard({ label, value, onAskWhy }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow flex flex-col justify-between gap-3 border border-gray-100 dark:border-gray-700/60">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{value}</p>
      </div>
      {onAskWhy && (
        <button
          onClick={() => onAskWhy(label)}
          className="self-start text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 px-2.5 py-1 rounded-lg transition flex items-center gap-1 border border-indigo-200/60 dark:border-indigo-800/60"
        >
          <span>🔬</span> Ask Why
        </button>
      )}
    </div>
  );
}

function ChartCard({ title, children, onAskWhy }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow border border-gray-100 dark:border-gray-700/60">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">{title}</h2>
        {onAskWhy && (
          <button
            onClick={() => onAskWhy(title)}
            className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition flex items-center gap-1 border border-indigo-200/60 dark:border-indigo-800/60"
          >
            <span>🔬</span> Ask Why
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function Dashboard() {
  const [summary, setSummary] = useState({});
  const [topProducts, setTopProducts] = useState([]);
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [prediction, setPrediction] = useState([]);
  const [aiSummary, setAiSummary] = useState({ summary: "", generatedAt: null });
  const [loadingAI, setLoadingAI] = useState(false);
  const [topCustomers, setTopCustomers] = useState([]);
  const [customerTypes, setCustomerTypes] = useState({ repeatCustomers: 0, newCustomers: 0 });
  const [radarStats, setRadarStats] = useState(null);
  const [askWhyOpen, setAskWhyOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState("Revenue");

  const navigate = useNavigate();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [
        summaryRes, productsRes, cityRes, categoryRes,
        paymentRes, predictionRes, topCustomersRes, customerTypesRes,
        radarRes
      ] = await Promise.all([
        axios.get(`${API}/api/insights/summary`, { headers }),
        axios.get(`${API}/api/insights/top-products`, { headers }),
        axios.get(`${API}/api/insights/sales-by-city`, { headers }),
        axios.get(`${API}/api/insights/sales-by-category`, { headers }),
        axios.get(`${API}/api/insights/payment-methods`, { headers }),
        axios.get(`${API}/api/insights/sales-prediction`, { headers }),
        axios.get(`${API}/api/insights/top-customers`, { headers }),
        axios.get(`${API}/api/insights/customer-types`, { headers }),
        axios.get(`${API}/api/decision/radar`, { headers }).catch(() => ({ data: null })),
      ]);

      setSummary(summaryRes.data);
      setTopProducts(productsRes.data);
      setCities(cityRes.data);
      setCategories(categoryRes.data);
      setPaymentMethods(paymentRes.data);
      setTopCustomers(topCustomersRes.data);
      setCustomerTypes(customerTypesRes.data);
      if (radarRes?.data) setRadarStats(radarRes.data);

      const { historical, predicted } = predictionRes.data;
      setPrediction([...(historical || []), ...(predicted || [])]);

      setLoadingAI(true);
      const aiRes = await axios.get(`${API}/api/insights/ai-summary`, { headers });
      setAiSummary(aiRes.data);

    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleRegenerateSummary = async () => {
    setLoadingAI(true);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`${API}/api/insights/regenerate-summary`, {}, { headers });
      const aiRes = await axios.get(`${API}/api/insights/ai-summary`, { headers });
      setAiSummary(aiRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAI(false);
    }
  };

  const handleOpenAskWhy = (metricName) => {
    setSelectedMetric(metricName || "Revenue");
    setAskWhyOpen(true);
  };

  const avgOrderValue = summary.count ? Math.round(summary.totalSales / summary.count) : 0;
  const totalCustomers = customerTypes.repeatCustomers + customerTypes.newCustomers;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">

      {/* Decision Intelligence Business Radar Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-indigo-900/50 flex flex-wrap justify-between items-center gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xl">📡</span>
            <span className="text-xs uppercase font-bold tracking-widest text-indigo-400">
              AI Decision Intelligence Layer
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
              Active
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">
            Live Business Radar & Decision Center
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            {radarStats?.stats?.totalRisks > 0
              ? `Detected ${radarStats.stats.totalRisks} active risk signals and ${radarStats.stats.totalOpportunities} growth opportunities requiring strategic decision.`
              : "System continuously detects risks, breaks down root causes, simulates what-if scenarios, and formulates action plans."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {radarStats?.stats && (
            <div className="flex gap-2 text-xs">
              <span className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 flex items-center gap-1">
                🔴 {radarStats.stats.totalRisks} Risks
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 flex items-center gap-1">
                🟢 {radarStats.stats.totalOpportunities} Opportunities
              </span>
            </div>
          )}
          <button
            onClick={() => navigate("/decision-center")}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold shadow-lg transition flex items-center gap-1.5"
          >
            <span>🧠</span> Open Decision Center →
          </button>
        </div>
      </div>

      {/* AI Summary */}
      <div className="bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 p-5 rounded-2xl shadow">
        <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
          <h2 className="text-lg font-semibold text-indigo-700 dark:text-indigo-300">🤖 AI Business Summary</h2>
          <div className="flex items-center gap-3 flex-wrap">
            {aiSummary.generatedAt && (
              <span className="text-xs text-gray-400">
                Last updated: {new Date(aiSummary.generatedAt).toLocaleString()}
              </span>
            )}
            <button
              onClick={handleRegenerateSummary}
              disabled={loadingAI}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg transition disabled:opacity-50"
            >
              {loadingAI ? "Regenerating..." : "🔄 Regenerate"}
            </button>
          </div>
        </div>
        {loadingAI ? (
          <p className="text-gray-400 italic text-sm">Generating summary...</p>
        ) : (
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
            {aiSummary.summary || "No summary yet. Upload data to generate one."}
          </p>
        )}
      </div>

      {/* Stat Cards with Ask Why */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Sales"
          value={`₹${summary.totalSales?.toLocaleString() || 0}`}
          onAskWhy={handleOpenAskWhy}
        />
        <StatCard
          label="Total Profit"
          value={`₹${summary.totalProfit?.toLocaleString() || 0}`}
          onAskWhy={handleOpenAskWhy}
        />
        <StatCard
          label="Orders"
          value={summary.count || 0}
          onAskWhy={handleOpenAskWhy}
        />
        <StatCard
          label="Avg Order Value"
          value={`₹${avgOrderValue.toLocaleString()}`}
          onAskWhy={handleOpenAskWhy}
        />
      </div>

      {/* Sales Trend */}
      <ChartCard title="📈 Sales Trend & 7-Day Prediction">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={prediction}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip formatter={(value) => `₹${value?.toLocaleString()}`} />
            <Line
              type="monotone"
              dataKey="totalSales"
              stroke="#6366f1"
              strokeWidth={2}
              dot={({ cx, cy, payload }) => (
                <circle
                  key={payload._id}
                  cx={cx} cy={cy} r={4}
                  fill={payload.predicted ? "#f59e0b" : "#6366f1"}
                  stroke="white" strokeWidth={1}
                />
              )}
            />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-xs text-gray-400 mt-2">🟣 Historical &nbsp; 🟡 Predicted (Linear Regression)</p>
      </ChartCard>

      {/* Top Products + City */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title="🏆 Top Products">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topProducts} margin={{ bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" angle={-30} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip formatter={(v) => `₹${v?.toLocaleString()}`} />
              <Bar dataKey="totalRevenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="🏙️ Sales by City">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={cities} margin={{ bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" angle={-30} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip formatter={(v) => `₹${v?.toLocaleString()}`} />
              <Bar dataKey="totalSales" fill="#22d3ee" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Category + Payment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title="🏷️ Sales by Category">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={categories} margin={{ bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" angle={-20} textAnchor="end" interval={0} tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip formatter={(v) => `₹${v?.toLocaleString()}`} />
              <Bar dataKey="totalSales" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="💳 Payment Methods">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={paymentMethods}
                dataKey="count"
                nameKey="_id"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`}
              >
                {paymentMethods.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Customer Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title="👤 Top Customers">
          <ul className="divide-y dark:divide-gray-700">
            {topCustomers.map((c, i) => (
              <li key={i} className="flex justify-between items-center py-3">
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-100">{c._id}</p>
                  <p className="text-xs text-gray-400">{c.orders} order{c.orders > 1 ? "s" : ""}</p>
                </div>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">₹{c.totalSpent?.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </ChartCard>

        <ChartCard title="🔁 Repeat vs New Customers">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={[
                  { name: "New", value: customerTypes.newCustomers },
                  { name: "Repeat", value: customerTypes.repeatCustomers },
                ]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={75}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                <Cell fill="#6366f1" />
                <Cell fill="#f59e0b" />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-around mt-3 text-center">
            <div>
              <p className="text-xl font-bold text-indigo-500">{customerTypes.newCustomers}</p>
              <p className="text-xs text-gray-500">New</p>
            </div>
            <div>
              <p className="text-xl font-bold text-yellow-500">{customerTypes.repeatCustomers}</p>
              <p className="text-xs text-gray-500">Repeat</p>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-700 dark:text-gray-300">{totalCustomers}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Chatbot */}
      <Chatbot />

      {/* Root Cause Ask Why Modal */}
      <AskWhyModal
        isOpen={askWhyOpen}
        onClose={() => setAskWhyOpen(false)}
        metricName={selectedMetric}
        onSelectSimulate={(preset) => navigate("/decision-center?tab=simulator")}
      />

    </div>
  );
}

export default Dashboard;