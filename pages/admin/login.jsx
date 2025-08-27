import { useState } from "react";
import { useRouter } from "next/router";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  function handleLogin(e) {
    e.preventDefault();
    if (username === "Peterr" && password === "54321") {
      localStorage.setItem("isAdmin", "true");
      router.push("/admin/dashboard");
    } else {
      alert("Invalid credentials");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <form
        onSubmit={handleLogin}
        className="bg-slate-800 p-6 rounded-xl w-80 shadow-lg"
      >
        <h1 className="text-xl font-bold mb-4 text-center">Admin Login</h1>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full mb-3 p-2 rounded bg-slate-700"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-3 p-2 rounded bg-slate-700"
        />
        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded"
        >
          Login
        </button>
      </form>
    </div>
  );
}
