import { useEffect, useState } from "react";
import axios from "axios";

export default function ProductMaster() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ productId: "", productName: "", category: "", costPrice: "", sellingPrice: "" });
  const [editingId, setEditingId] = useState(null);
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };
  const API = process.env.REACT_APP_API_URL;

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/product-master`, { headers });
    setProducts(res.data);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!form.productId || !form.productName || !form.costPrice || !form.sellingPrice) {
      alert("Please fill all fields");
      return;
    }
    if (editingId) {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/product-master/${editingId}`, form, { headers });
      setEditingId(null);
    } else {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/product-master`, form, { headers });
    }
    setForm({ productId: "", productName: "", category: "", costPrice: "", sellingPrice: "" });
    fetchProducts();
  };

  const handleEdit = (p) => {
    setForm({ productId: p.productId, productName: p.productName, category: p.category, costPrice: p.costPrice, sellingPrice: p.sellingPrice });
    setEditingId(p._id);
  };

  const handleDelete = async (id) => {
    await axios.delete(`http://localhost:5000/api/product-master/${id}`, { headers });
    fetchProducts();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">📦 Product Master</h1>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
          {editingId ? "Edit Product" : "Add Product"}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {["productId", "productName", "category", "costPrice", "sellingPrice"].map((field) => (
            <input
              key={field}
              name={field}
              placeholder={field.replace(/([A-Z])/g, " $1").trim()}
              value={form[field]}
              onChange={handleChange}
              type={field.includes("Price") ? "number" : "text"}
              className="border dark:border-gray-600 rounded-xl px-4 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
            />
          ))}
        </div>
        <button
          onClick={handleSubmit}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-xl transition"
        >
          {editingId ? "Update Product" : "Add Product"}
        </button>
        {editingId && (
          <button
            onClick={() => { setEditingId(null); setForm({ productId: "", productName: "", category: "", costPrice: "", sellingPrice: "" }); }}
            className="w-full mt-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-2 rounded-xl transition"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            <tr>
              {["Product ID", "Product Name", "Category", "Cost Price", "Selling Price", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-gray-700">
            {products.map((p) => (
              <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{p.productId}</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{p.productName}</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{p.category}</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">₹{p.costPrice}</td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">₹{p.sellingPrice}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => handleEdit(p)} className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded-lg text-xs">Edit</button>
                  <button onClick={() => handleDelete(p._id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs">Delete</button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan="6" className="px-4 py-6 text-center text-gray-400">No products added yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}