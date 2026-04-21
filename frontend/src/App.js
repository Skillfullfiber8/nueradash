import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import UploadCSV from "./components/UploadCSV";
import Dashboard from "./pages/Dashboard";
import ProductMaster from "./pages/ProductMaster";
import SmartImport from "./pages/SmartImport";
import SalesRecords from "./pages/SalesRecords";

function App() {
  const token = localStorage.getItem("token");

  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
          <Navbar />
          <Routes>
            <Route path="/" element={<Navigate to={token ? "/dashboard" : "/login"} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/upload" element={<UploadCSV />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<ProductMaster />} />
            <Route path="/smart-import" element={<SmartImport />} />
            <Route path="/sales-records" element={<SalesRecords />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;