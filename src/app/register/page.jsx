"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage(data.msg);
      router.push("/login");
    } else {
      setMessage(data.msg);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="p-8 bg-gray-800 rounded shadow-md w-96"
      >
        <h1 className="text-3xl font-bold mb-6 text-white text-center">
          Înregistrare
        </h1>
        {message && <p className="mb-4 text-red-400">{message}</p>}
        <div className="mb-4">
          <label className="block mb-1 text-white">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="border border-gray-400 rounded w-full p-2 bg-gray-700 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Introdu username-ul"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 text-white">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border border-gray-400 rounded w-full p-2 bg-gray-700 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Introdu email-ul"
          />
        </div>
        <div className="mb-6">
          <label className="block mb-1 text-white">Parolă</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border border-gray-400 rounded w-full p-2 bg-gray-700 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Introdu parola"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Înregistrare
        </button>
      </form>
    </div>
  );
}