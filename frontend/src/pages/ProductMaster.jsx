import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default function ProductMaster() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ productId: "", productName: "", category: "", costPrice: "", sellingPrice: "" });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const getHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : null;
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const headers = getHeaders();
    if (!headers) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      const res = await axios.get(`${API}/api/product-master`, { headers });
      setProducts(res.data);
    } catch (err) {
      console.error("Fetch products error:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("token");
        alert("Your session has expired. Please log in again.");
        navigate("/login");
      } else {
        setErrorMsg(err.response?.data?.message || "Failed to load products");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!form.productId || !form.productName || !form.costPrice || !form.sellingPrice) {
      alert("Please fill all required fields");
      return;
    }

    const headers = getHeaders();
    if (!headers) {
      navigate("/login");
      return;
    }

    try {
      if (editingId) {
        await axios.put(`${API}/api/product-master/${editingId}`, form, { headers });
        setEditingId(null);
      } else {
        await axios.post(`${API}/api/product-master`, form, { headers });
      }
      setForm({ productId: "", productName: "", category: "", costPrice: "", sellingPrice: "" });
      fetchProducts();
    } catch (err) {
      console.error("Save product error:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        alert(err.response?.data?.message || "Failed to save product");
      }
    }
  };

  const handleEdit = (p) => {
    setForm({
      productId: p.productId,
      productName: p.productName,
      category: p.category,
      costPrice: p.costPrice,
      sellingPrice: p.sellingPrice,
    });
    setEditingId(p._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    const headers = getHeaders();
    if (!headers) {
      navigate("/login");
      return;
    }

    try {
      await axios.delete(`${API}/api/product-master/${id}`, { headers });
      fetchProducts();
    } catch (err) {
      console.error("Delete product error:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        alert(err.response?.data?.message || "Failed to delete product");
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <span>📦</span> Product Master
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Maintain your product catalog, cost prices, and standard selling prices for automated profit calculations.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl text-xs flex justify-between items-center">
          <span>{errorMsg}</span>
          <button onClick={fetchProducts} className="underline font-semibold">Try Again</button>
        </div>
      )}

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <span>{editingId ? "✏️" : "➕"}</span>
          {editingId ? "Edit Product Details" : "Add New Product"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Product ID / SKU *</label>
            <input
              name="productId"
              placeholder="e.g. PROD-101"
              value={form.productId}
              onChange={handleChange}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Product Name *</label>
            <input
              name="productName"
              placeholder="e.g. Wireless Headphones"
              value={form.productName}
              onChange={handleChange}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Category</label>
            <input
              name="category"
              placeholder="e.g. Electronics"
              value={form.category}
              onChange={handleChange}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Cost Price (₹) *</label>
            <input
              name="costPrice"
              placeholder="e.g. 1500"
              value={form.costPrice}
              onChange={handleChange}
              type="number"
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">Selling Price (₹) *</label>
            <input
              name="sellingPrice"
              placeholder="e.g. 2999"
              value={form.sellingPrice}
              onChange={handleChange}
              type="number"
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition text-sm shadow"
          >
            {editingId ? "Update Product" : "Save Product to Master"}
          </button>
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setForm({ productId: "", productName: "", category: "", costPrice: "", sellingPrice: "" });
              }}
              className="px-6 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-2.5 rounded-xl transition text-sm hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700/60 flex justify-between items-center">
          <h3 className="font-bold text-sm text-gray-800 dark:text-gray-100">
            Registered Products ({products.length})
          </h3>
          {loading && (
            <span className="text-xs text-indigo-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span> Loading catalog...
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-700 dark:text-gray-200 uppercase font-semibold">
              <tr>
                <th className="px-5 py-3">Product ID</th>
                <th className="px-5 py-3">Product Name</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Cost Price</th>
                <th className="px-5 py-3">Selling Price</th>
                <th className="px-5 py-3">Gross Margin</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {products.map((p) => {
                const margin = p.sellingPrice > 0 ? (((p.sellingPrice - (p.costPrice || 0)) / p.sellingPrice) * 100).toFixed(1) : 0;
                return (
                  <tr key={p._id} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/30 transition">
                    <td className="px-5 py-3.5 font-mono text-gray-800 dark:text-gray-200">{p.productId}</td>
                    <td className="px-5 py-3.5 font-semibold text-gray-800 dark:text-gray-100">{p.productName}</td>
                    <td className="px-5 py-3.5">{p.category || "General"}</td>
                    <td className="px-5 py-3.5">₹{p.costPrice?.toLocaleString("en-IN") || 0}</td>
                    <td className="px-5 py-3.5 font-bold text-gray-800 dark:text-gray-100">₹{p.sellingPrice?.toLocaleString("en-IN") || 0}</td>
                    <td className="px-5 py-3.5 font-semibold text-emerald-600 dark:text-emerald-400">
                      {margin}%
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(p)}
                        className="bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 px-3 py-1 rounded-lg font-medium hover:bg-amber-100 dark:hover:bg-amber-900 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 px-3 py-1 rounded-lg font-medium hover:bg-rose-100 dark:hover:bg-rose-900 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center text-gray-400">
                    <p className="text-2xl mb-1">📦</p>
                    <p className="text-sm font-medium">No products added yet</p>
                    <p className="text-xs mt-0.5">Add products above or import sales data to auto-discover SKUs.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}