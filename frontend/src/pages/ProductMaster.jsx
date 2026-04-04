import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function ProductMaster() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ productId: "", productName: "", category: "", costPrice: "", sellingPrice: "" });
  const [editingId, setEditingId] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const res = await axios.get("http://localhost:5000/api/product-master", { headers });
    setProducts(res.data);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.productId || !form.productName || !form.costPrice || !form.sellingPrice) {
      alert("Please fill all fields");
      return;
    }
    if (editingId) {
      await axios.put(`http://localhost:5000/api/product-master/${editingId}`, form, { headers });
      setEditingId(null);
    } else {
      await axios.post("http://localhost:5000/api/product-master", form, { headers });
    }
    setForm({ productId: "", productName: "", category: "", costPrice: "", sellingPrice: "" });
    fetchProducts();
  };

  const handleEdit = (product) => {
    setForm({
      productId: product.productId,
      productName: product.productName,
      category: product.category,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
    });
    setEditingId(product._id);
  };

  const handleDelete = async (id) => {
    await axios.delete(`http://localhost:5000/api/product-master/${id}`, { headers });
    fetchProducts();
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📦 Product Master</h1>
        <button onClick={() => navigate("/dashboard")} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
          Back to Dashboard
        </button>
      </div>

      {/* Form */}
      <div className="bg-white p-4 rounded shadow mb-6 grid grid-cols-5 gap-3">
        <input name="productId" placeholder="Product ID" value={form.productId} onChange={handleChange} className="border p-2 rounded" />
        <input name="productName" placeholder="Product Name" value={form.productName} onChange={handleChange} className="border p-2 rounded" />
        <input name="category" placeholder="Category" value={form.category} onChange={handleChange} className="border p-2 rounded" />
        <input name="costPrice" placeholder="Cost Price" type="number" value={form.costPrice} onChange={handleChange} className="border p-2 rounded" />
        <input name="sellingPrice" placeholder="Selling Price" type="number" value={form.sellingPrice} onChange={handleChange} className="border p-2 rounded" />
        <button onClick={handleSubmit} className="col-span-5 bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
          {editingId ? "Update Product" : "Add Product"}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-3">Product ID</th>
              <th className="p-3">Product Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Cost Price</th>
              <th className="p-3">Selling Price</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id} className="border-t">
                <td className="p-3">{p.productId}</td>
                <td className="p-3">{p.productName}</td>
                <td className="p-3">{p.category}</td>
                <td className="p-3">₹{p.costPrice}</td>
                <td className="p-3">₹{p.sellingPrice}</td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => handleEdit(p)} className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500">Edit</button>
                  <button onClick={() => handleDelete(p._id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Delete</button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan="6" className="p-4 text-center text-gray-400">No products added yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}