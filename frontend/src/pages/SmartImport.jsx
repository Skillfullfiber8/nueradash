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
  const [step, setStep] = useState(1);
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
        `${process.env.REACT_APP_API_URL}/api/smart-import/analyze`,
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
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/smart-import/import`,
        { filePath, mapping },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(`✅ ${res.data.message} (${res.data.rows_saved} rows saved)`);
      setStep(3);
    } catch (err) {
      alert("Import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">🤖 Smart Import</h1>

      {/* Step 1 */}
      {step === 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-8 max-w-lg mx-auto">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Upload any CSV file</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            AI will analyze your columns and suggest mappings automatically.
          </p>
          <label className="block w-full border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-500 transition mb-4">
            <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} className="hidden" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {file ? `📄 ${file.name}` : "Click to select a CSV file"}
            </p>
          </label>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-xl transition disabled:opacity-50"
          >
            {loading ? "Analyzing with AI..." : "Analyze with AI"}
          </button>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">Review Column Mapping</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            AI has suggested mappings below. Fix any that are wrong.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {TARGET_COLUMNS.map((targetCol) => (
              <div key={targetCol} className="flex items-center gap-3">
                <label className="w-36 text-xs font-medium text-gray-600 dark:text-gray-400 shrink-0">{targetCol}</label>
                <select
                  value={mapping[targetCol] || "skip"}
                  onChange={(e) => setMapping(prev => ({ ...prev, [targetCol]: e.target.value }))}
                  className="border dark:border-gray-600 rounded-lg px-2 py-1 flex-1 text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                >
                  <option value="skip">-- skip --</option>
                  {uploadedColumns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Sample Preview */}
          <div className="overflow-x-auto mb-6 rounded-xl border dark:border-gray-700">
            <table className="text-xs w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  {uploadedColumns.map((col) => (
                    <th key={col} className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {sampleRows.map((row, i) => (
                  <tr key={i}>
                    {uploadedColumns.map((col) => (
                      <td key={col} className="px-3 py-2 text-gray-700 dark:text-gray-300">{row[col]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleImport}
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-xl transition disabled:opacity-50"
          >
            {loading ? "Importing..." : "Confirm & Import"}
          </button>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-8 max-w-lg mx-auto text-center">
          <p className="text-xl font-semibold text-green-500 mb-6">{message}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2 rounded-xl font-semibold transition"
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}