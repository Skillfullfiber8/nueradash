import { useState } from "react";
import axios from "axios";

function Upload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a CSV file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    // product master JSON
    formData.append(
      "productMaster",
      JSON.stringify([
        {
          ProductID: "P001",
          productName: "Protein Powder",
          category: "Health",
          costPrice: 900,
          sellingPrice: 1200,
          profitMargin: 300,
        },
        {
          ProductID: "P002",
          productName: "Green Tea",
          category: "Wellness",
          costPrice: 150,
          sellingPrice: 250,
          profitMargin: 100,
        },
        {
          ProductID: "P003",
          productName: "Vitamin C",
          category: "Supplements",
          costPrice: 320,
          sellingPrice: 499,
          profitMargin: 179,
        },
        {
          ProductID: "P004",
          productName: "Detox Juice",
          category: "Health",
          costPrice: 80,
          sellingPrice: 150,
          profitMargin: 70,
        },
      ])
    );

    try {
      setLoading(true);

      const res = await axios.post(
  "http://localhost:5000/api/upload/sales-standardized",
  formData,
  {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  }
);

      alert("Upload successful 🚀");
      console.log(res.data);
    } catch (err) {
      console.error(err);
      alert("Upload failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-6 rounded shadow w-96">
        <h2 className="text-2xl font-bold mb-4 text-center">📂 Upload CSV</h2>

        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files[0])}
          className="mb-4"
        />

        <button
          onClick={handleUpload}
          className="bg-blue-500 text-white px-4 py-2 rounded w-full"
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>
    </div>
  );
}

export default Upload;