import { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts";
import Chatbot from "../components/Chatbot";

const COLORS = ["#6366f1", "#22d3ee", "#f59e0b", "#10b981", "#f43f5e", "#8b5cf6", "#ec4899"];
const API = process.env.REACT_APP_API_URL;

function StatCard({ label, value }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow flex flex-col gap-1">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow">
      <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">{title}</h2>
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

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const [
        summaryRes, productsRes, cityRes, categoryRes,
        paymentRes, predictionRes, topCustomersRes, customerTypesRes
      ] = await Promise.all([
        axios.get(`${API}/api/insights/summary`, { headers }),
        axios.get(`${API}/api/insights/top-products`, { headers }),
        axios.get(`${API}/api/insights/sales-by-city`, { headers }),
        axios.get(`${API}/api/insights/sales-by-category`, { headers }),
        axios.get(`${API}/api/insights/payment-methods`, { headers }),
        axios.get(`${API}/api/insights/sales-prediction`, { headers }),
        axios.get(`${API}/api/insights/top-customers`, { headers }),
        axios.get(`${API}/api/insights/customer-types`, { headers }),
      ]);

      setSummary(summaryRes.data);
      setTopProducts(productsRes.data);
      setCities(cityRes.data);
      setCategories(categoryRes.data);
      setPaymentMethods(paymentRes.data);
      setTopCustomers(topCustomersRes.data);
      setCustomerTypes(customerTypesRes.data);

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

  const avgOrderValue = summary.count ? Math.round(summary.totalSales / summary.count) : 0;
  const totalCustomers = customerTypes.repeatCustomers + customerTypes.newCustomers;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">

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

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Sales" value={`₹${summary.totalSales?.toLocaleString() || 0}`} />
        <StatCard label="Total Profit" value={`₹${summary.totalProfit?.toLocaleString() || 0}`} />
        <StatCard label="Orders" value={summary.count || 0} />
        <StatCard label="Avg Order Value" value={`₹${avgOrderValue.toLocaleString()}`} />
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

    </div>
  );
}

export default Dashboard;