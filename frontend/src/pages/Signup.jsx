import AuthForm from "../components/AuthForm";

export default function Signup() {
  const handleSignup = async (formData) => {
    const res = await fetch("http://localhost:5000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await res.json();
    console.log(data);

    if (data.message === "Signup successful!") {
      alert("Signup Successful!");
    }
  };

  return (
    <AuthForm
      title="Signup"
      buttonLabel="Create Account"
      onSubmit={handleSignup}
    />
  );
}