"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";


export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
  try {
   const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ username, password }),
});


    // ✅ Check if response is OK
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();

 if (data.status === "login successful") {
  localStorage.setItem("user_id", data.user_id);
  localStorage.setItem("role", data.role);
  alert("Login successful!");
  router.push("/dashboard/" + data.user_id); // ✅ redirect to dashboard
} else {
  alert("Login failed!");
}

  } catch (error: any) {
    console.error("Login error:", error);
    alert(`Login error: ${error.message}`);
  }
};


  return (
    <div style={{ padding: "20px" }}>
      <h1>Login</h1>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}

