import { useEffect, useState } from "react";
import axios from "axios";

const API = process.env.REACT_APP_API_URL;

export default function SalesRecords() {
  const [records, setRecords] = useState([]);
  const [expandedDates, setExpandedDates] = useState({});
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({});
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchRecords(); }, []);

  const fetchRecords = async (start = "", end = "") => {
    setLoading(true);
    try {
      let url = `${API}/api/insights/sales-records`;
      const params = [];
      if (start) params.push(`startDate=${start}`);
      if (end) params.push(`endDate=${end}`);
      if (params.length) url += `?${params.join("&")}`;
      const res = await axios.get(url, { headers });
      setRecords(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const regenerateSummary = async () => {
    try {
      await axios.post(`${API}/api/insights/regenerate-summary`, {}, { headers });
    } catch (err) {
      console.error("Summary regeneration failed:", err.message);
    }
  };

  const handleFilter = () => fetchRecords(startDate, endDate);

  const handleClearFilter = () => {
    setStartDate("");
    setEndDate("");
    fetchRecords();
  };

  const toggleDate = (date) => {
    setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this record?")) return;
    try {
      await axios.delete(`${API}/api/insights/sales-records/${id}`, { headers });
      await regenerateSummary();
      fetchRecords(startDate, endDate);
    } catch (err) {
      alert("Delete failed");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Delete ALL sales records? This cannot be undone.")) return;
    try {
      await axios.delete(`${API}/api/insights/sales-records`, { headers });
      await regenerateSummary();
      setRecords([]);
    } catch (err) {
      alert("Failed to clear records");
    }
  };

  const handleEditOpen = (record) => {
    setEditingRecord(record._id);
    setEditForm({
      customerName: record.customerName,
      productName: record.productName,
      category: record.category,
      quantity: record.quantity,
      price: record.price,
      region: record.region,
      location: record.location,
      paymentMethod: record.paymentMethod,
    });
  };

  const handleEditSave = async () => {
    try {
      await axios.put(
        `${API}/api/insights/sales-records/${editingRecord}`,
        editForm,
        { headers }
      );
      await regenerateSummary();
      setEditingRecord(null);
      fetchRecords(startDate, endDate);
    } catch (err) {
      alert("Update failed");
    }
  };

  const totalOrders = records.reduce((sum, d) => sum + d.orders, 0);
  const totalSales = records.reduce((sum, d) => sum + d.totalSales, 0);
  const totalProfit = records.reduce((sum, d) => sum + d.totalProfit, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">📅 Sales Records</h1>
        <button
          onClick={handleClearAll}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
        >
          🗑️ Clear All Data
        </button>
      </div>

      {/* Date Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">From Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">To Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <button
          onClick={handleFilter}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
        >
          Filter
        </button>
        <button
          onClick={handleClearFilter}
          className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl text-sm font-semibold transition"
        >
          Clear
        </button>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Orders</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{totalOrders}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Sales</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">₹{totalSales.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Profit</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">₹{totalProfit.toLocaleString()}</p>
        </div>
      </div>

      {/* Records */}
      {loading ? (
        <p className="text-center text-gray-400 py-10">Loading...</p>
      ) : records.length === 0 ? (
        <p className="text-center text-gray-400 py-10">No records found.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {records.map((dateGroup) => (
            <div key={dateGroup._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow overflow-hidden">

              {/* Date Row */}
              <div
                className="flex justify-between items-center px-5 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                onClick={() => toggleDate(dateGroup._id)}
              >
                <div className="flex items-center gap-4">
                  <span className="text-lg font-semibold text-gray-800 dark:text-white">
                    📅 {dateGroup._id}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {dateGroup.orders} order{dateGroup.orders > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Sales</p>
                    <p className="font-semibold text-indigo-600 dark:text-indigo-400">₹{dateGroup.totalSales.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Profit</p>
                    <p className="font-semibold text-green-600 dark:text-green-400">₹{dateGroup.totalProfit.toLocaleString()}</p>
                  </div>
                  <span className="text-gray-400 text-lg">
                    {expandedDates[dateGroup._id] ? "▲" : "▼"}
                  </span>
                </div>
              </div>

              {/* Expanded Records */}
              {expandedDates[dateGroup._id] && (
                <div className="border-t dark:border-gray-700 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        {["Sale ID", "Customer", "Product", "Category", "Qty", "Price", "Total", "Region", "Payment", "Actions"].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                      {dateGroup.records.map((rec) => (
                        <tr key={rec._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">{rec.saleId}</td>
                          <td className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">{rec.customerName}</td>
                          <td className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">{rec.productName}</td>
                          <td className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">{rec.category}</td>
                          <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{rec.quantity}</td>
                          <td className="px-3 py-2 text-gray-700 dark:text-gray-300">₹{rec.price?.toLocaleString()}</td>
                          <td className="px-3 py-2 font-semibold text-gray-800 dark:text-white whitespace-nowrap">₹{rec.totalAmount?.toLocaleString()}</td>
                          <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{rec.region}</td>
                          <td className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">{rec.paymentMethod}</td>
                          <td className="px-3 py-2 flex gap-2">
                            <button
                              onClick={() => handleEditOpen(rec)}
                              className="bg-yellow-400 hover:bg-yellow-500 text-white px-2 py-1 rounded-lg text-xs whitespace-nowrap"
                            >Edit</button>
                            <button
                              onClick={() => handleDelete(rec._id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-lg text-xs"
                            >Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">✏️ Edit Record</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {Object.entries(editForm).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </label>
                  <input
                    value={value}
                    onChange={(e) => setEditForm(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleEditSave}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-xl font-semibold transition"
              >
                Save
              </button>
              <button
                onClick={() => setEditingRecord(null)}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-xl font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}