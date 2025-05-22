import { useState } from 'react';

export default function SignUp() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone_number: ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSignUp = async () => {
    try {
      const res = await fetch("https://your-api-url/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      console.log("Signup successful:", data);
    } catch (err) {
      console.error("Signup error:", err);
    }
  };

  return (
    <div>
      <h2>Sign Up</h2>
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
      <input
        name="name"
        placeholder="Full Name"
        value={formData.name}
        onChange={handleChange}
      />
      <input
        name="phone_number"
        placeholder="Phone Number (+1234567890)"
        value={formData.phone_number}
        onChange={handleChange}
      />
      <button onClick={handleSignUp}>Sign Up</button>
    </div>
  );
}
