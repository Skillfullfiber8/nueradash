import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import UploadCSV from "./components/UploadCSV";
import Dashboard from "./pages/Dashboard";
import ProductMaster from "./pages/ProductMaster";
import SmartImport from "./pages/SmartImport";


function App() {
  const token = localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={token ? "/dashboard" : "/login"} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/upload" element={<UploadCSV />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<ProductMaster />} />
        <Route path="/smart-import" element={<SmartImport />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;