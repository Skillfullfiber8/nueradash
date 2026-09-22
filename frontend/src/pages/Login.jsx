import { useNavigate } from "react-router-dom";
import AuthForm from "../components/AuthForm";
import { API_BASE_URL } from "../config/api";

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = async (formData) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        navigate("/dashboard");
      } else {
        alert(data.message || "Login failed! Please verify your credentials.");
      }
    } catch (err) {
      console.error("Login request error:", err);
      alert("Unable to connect to the backend server. Please check your network connection.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-indigo-600 dark:text-indigo-400 mb-2">
          📊 Nueradash
        </h1>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-6 text-sm">
          Sign in to your account
        </p>
        <AuthForm title="Login" buttonLabel="Login" onSubmit={handleLogin} />
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          Don't have an account?{" "}
          <span
            onClick={() => navigate("/signup")}
            className="text-indigo-600 dark:text-indigo-400 cursor-pointer font-semibold hover:underline"
          >
            Sign Up
          </span>
        </p>
      </div>
    </div>
  );
}