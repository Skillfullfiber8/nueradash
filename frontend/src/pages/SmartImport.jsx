import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const TARGET_COLUMNS = [
  "Sale ID", "Customer Name", "Region", "Customer Email",
  "Customer Phone", "Product ID", "Product Name", "Category",
  "Quantity", "Price", "Date", "Location", "Payment Method"
];

export default function SmartImport() {
  const [file, setFile] = useState(null);
  const [step, setStep] = useState(1); // 1=upload, 2=mapping, 3=done
  const [uploadedColumns, setUploadedColumns] = useState([]);
  const [mapping, setMapping] = useState({});
  const [sampleRows, setSampleRows] = useState([]);
  const [filePath, setFilePath] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleAnalyze = async () => {
    if (!file) return alert("Please select a file");
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/smart-import/analyze",
        formData,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
      );
      setUploadedColumns(res.data.uploadedColumns);
      setMapping(res.data.mapping);
      setSampleRows(res.data.sampleRows);
      setFilePath(res.data.filePath);
      setStep(2);
    } catch (err) {
      alert("Failed to analyze file");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (targetCol, value) => {
    setMapping((prev) => ({ ...prev, [targetCol]: value }));
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/smart-import/import",
        { filePath, mapping },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(`✅ ${res.data.message} (${res.data.rows_saved} rows saved)`);
      setStep(3);
    } catch (err) {
      alert("Import failed");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">🤖 Smart Import</h1>
        <button onClick={() => navigate("/dashboard")} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
          Back to Dashboard
        </button>
      </div>

      {/* Step 1 — Upload */}
      {step === 1 && (
        <div className="bg-white p-6 rounded shadow max-w-lg">
          <h2 className="text-xl font-semibold mb-4">Upload any CSV file</h2>
          <p className="text-gray-500 mb-4">AI will analyze your columns and suggest mappings automatically.</p>
          <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} className="mb-4" />
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Analyze with AI"}
          </button>
        </div>
      )}

      {/* Step 2 — Mapping */}
      {step === 2 && (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Review Column Mapping</h2>
          <p className="text-gray-500 mb-4">AI has suggested mappings below. Fix any that are wrong, set unrecognized ones manually.</p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {TARGET_COLUMNS.map((targetCol) => (
              <div key={targetCol} className="flex items-center gap-3">
                <label className="w-40 text-sm font-medium text-gray-700">{targetCol}</label>
                <select
                  value={mapping[targetCol] || "skip"}
                  onChange={(e) => handleMappingChange(targetCol, e.target.value)}
                  className="border rounded p-1 flex-1 text-sm"
                >
                  <option value="skip">-- skip --</option>
                  {uploadedColumns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Sample data preview */}
          <div className="mb-6 overflow-x-auto">
            <h3 className="font-semibold mb-2">Sample Data Preview</h3>
            <table className="text-sm border w-full">
              <thead className="bg-gray-100">
                <tr>
                  {uploadedColumns.map((col) => (
                    <th key={col} className="border p-2 text-left">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sampleRows.map((row, i) => (
                  <tr key={i}>
                    {uploadedColumns.map((col) => (
                      <td key={col} className="border p-2">{row[col]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleImport}
            disabled={loading}
            className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? "Importing..." : "Confirm & Import"}
          </button>
        </div>
      )}

      {/* Step 3 — Done */}
      {step === 3 && (
        <div className="bg-white p-6 rounded shadow max-w-lg text-center">
          <p className="text-2xl mb-4">{message}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}