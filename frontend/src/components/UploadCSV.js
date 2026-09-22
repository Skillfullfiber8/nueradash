import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = process.env.REACT_APP_API_URL;

const UploadCSV = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [uploaded, setUploaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!file) return setMessage("Please select a file");
    setLoading(true);
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        `${API}/api/upload/upload-sales-customer`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(
        `✅ File uploaded successfully! ${res.data.rows_saved} rows saved.${
          res.data.new_products_added > 0
            ? ` ${res.data.new_products_added} new product(s) added to your Product Master — update their cost prices for accurate profit calculation.`
            : ""
        }`
      );
      setUploaded(true);
    } catch (err) {
      console.error(err);
      setMessage("❌ Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          ⬆️ Upload CSV
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Upload your sales CSV file to update the dashboard. New products will be automatically added to your Product Master.
        </p>

        <label className="block w-full border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-500 transition mb-4">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {file ? `📄 ${file.name}` : "Click to select a CSV file"}
          </p>
        </label>

        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-xl transition disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload"}
        </button>

        {message && (
          <p className={`mt-4 text-sm text-center ${uploaded ? "text-green-500" : "text-red-500"}`}>
            {message}
          </p>
        )}

        {uploaded && (
          <div className="flex flex-col gap-2 mt-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-xl transition"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate("/products")}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-semibold py-2 rounded-xl transition"
            >
              Update Product Cost Prices
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadCSV;