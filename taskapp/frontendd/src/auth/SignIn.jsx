import { useState } from 'react';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleLogin = async () => {
    try {
      const res = await fetch("https://your-api-url/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      console.log("Login successful:", data);

      // Store tokens if returned (for session management)
      if (data.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
        alert("Logged in successfully!");
      } else {
        alert("Login failed.");
      }

    } catch (err) {
      console.error("Login error:", err);
    }
  };

  return (
    <div>
      <h2>Log In</h2>
      <input
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={handleChange}
      />
      <button onClick={handleLogin}>Log In</button>
    </div>
  );
}
