import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ["#6366f1", "#22d3ee", "#f59e0b", "#10b981", "#f43f5e"];

function Dashboard() {
  const [summary, setSummary] = useState({});
  const [topProducts, setTopProducts] = useState([]);
  const [regions, setRegions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const summaryRes = await axios.get("http://localhost:5000/api/insights/summary", { headers });
      const productsRes = await axios.get("http://localhost:5000/api/insights/top-products", { headers });
      const regionRes = await axios.get("http://localhost:5000/api/insights/sales-by-region", { headers });

      setSummary(summaryRes.data);
      setTopProducts(productsRes.data);
      setRegions(regionRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📊 Dashboard</h1>
        <div className="flex gap-3">
          <button onClick={() => navigate("/upload")} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Upload CSV
          </button>
          <button onClick={() => navigate("/smart-import")} className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
              Smart Import
            </button>
          <button onClick={() => navigate("/products")} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
            Products
          </button>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
            Logout
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-gray-500">Total Sales</h2>
          <p className="text-2xl font-bold">₹{summary.totalSales}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-gray-500">Total Profit</h2>
          <p className="text-2xl font-bold">₹{summary.totalProfit}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-gray-500">Orders</h2>
          <p className="text-2xl font-bold">{summary.count}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6 mb-6">

        {/* Bar Chart - Top Products */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">🏆 Top Products</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" angle={-30} textAnchor="end" interval={0} tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip formatter={(value) => `₹${value}`} />
              <Bar dataKey="totalRevenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Sales by Region */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">🌍 Sales by Region</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={regions}
                dataKey="totalSales"
                nameKey="_id"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`}
              >
                {regions.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₹${value}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-2 gap-6">

        {/* Top Products Table */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-3">🏆 Top Products</h2>
          <ul>
            {topProducts.map((p, i) => (
              <li key={i} className="flex justify-between border-b py-2">
                <span>{p._id}</span>
                <span>₹{p.totalRevenue}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Region Table */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-3">🌍 Sales by Region</h2>
          <ul>
            {regions.map((r, i) => (
              <li key={i} className="flex justify-between border-b py-2">
                <span>{r._id}</span>
                <span>₹{r.totalSales}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;