import { useNavigate } from "react-router-dom";
import AuthForm from "../components/AuthForm";

export default function Signup() {
  const navigate = useNavigate();

  const handleSignup = async (formData) => {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (res.ok) {
      alert("Signup successful! Please login.");
      navigate("/login");
    } else {
      alert(data.message || "Signup failed!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center text-indigo-600 dark:text-indigo-400 mb-2">
          📊 Nueradash
        </h1>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-6 text-sm">
          Create your account
        </p>
        <AuthForm title="Sign Up" buttonLabel="Sign Up" onSubmit={handleSignup} />
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-indigo-600 dark:text-indigo-400 cursor-pointer font-semibold hover:underline"
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}