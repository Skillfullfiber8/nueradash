import { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

function BackendStatus() {
  const [message, setMessage] = useState("Checking backend connection...");

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/`)
      .then((res) => setMessage(typeof res.data === "string" ? res.data : "✅ Backend Connected"))
      .catch(() => setMessage("❌ Backend connection failed"));
  }, []);

  return (
    <div className="mt-6 p-6 bg-gray-800 text-white rounded-xl shadow-md">
      <h2 className="text-xl font-semibold">Backend Status:</h2>
      <p className="mt-2 text-gray-300">{message}</p>
    </div>
  );
}

export default BackendStatus;
