import AuthForm from "../components/AuthForm";

export default function Login() {
  const handleLogin = async (formData) => {
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await res.json();
    console.log(data);

    if (data.token) {
      localStorage.setItem("token", data.token);
      alert("Login Successful!");
    } else {
      alert("Login failed!");
    }
  };

  return (
    <AuthForm
      title="Login"
      buttonLabel="Login"
      onSubmit={handleLogin}
    />
  );
}