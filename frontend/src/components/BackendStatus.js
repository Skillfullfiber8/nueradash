import { useEffect, useState } from "react";
import axios from "axios";

function BackendStatus() {
  const [message, setMessage] = useState("Checking backend connection...");

  useEffect(() => {
    axios
      .get("http://localhost:5000")
      .then((res) => setMessage(res.data))
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
