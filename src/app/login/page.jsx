// src/app/login/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(""); // Resetăm mesajele

    try {
      // Apel API pentru autentificare tradițională (JWT)
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.msg || "Eroare la autentificare.");
      } else {
        // Autentificare reușită: stocăm token-ul și detaliile utilizatorului, inclusiv role
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username);
        localStorage.setItem("email", data.email);
        localStorage.setItem("role", data.role);
        window.dispatchEvent(
          new CustomEvent("profileUpdate", {
            detail: { username: data.username, email: data.email, role: data.role },
          })
        );
        setMessage("Autentificare reușită!");
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Eroare la conectarea cu serverul:", error);
      setMessage("Eroare de rețea sau server.");
    }
  }

  function handleGoogleSignIn() {
    // Autentificare OAuth Google prin NextAuth
    signIn("google", { callbackUrl: "/dashboard" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="p-8 bg-gray-800 rounded shadow-md w-96">
        <h1 className="text-3xl font-bold mb-6 text-white text-center">Log-in</h1>
        {message && <p className="mb-4 text-red-400">{message}</p>}

        <form onSubmit={handleSubmit} className="mb-4">
          <div className="mb-4">
            <label className="block mb-1 text-white">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Introdu email-ul"
              className="border border-gray-400 rounded w-full p-2 bg-gray-700 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-6">
            <label className="block mb-1 text-white">Parolă</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Introdu parola"
              className="border border-gray-400 rounded w-full p-2 bg-gray-700 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Log-in
          </button>
        </form>

        <div className="flex items-center my-4">
          <div className="flex-grow border-t border-gray-600"></div>
          <span className="mx-2 text-white">sau</span>
          <div className="flex-grow border-t border-gray-600"></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="w-full py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Sign in with Google
        </button>

        <div className="mt-4 text-center text-white">
          Nu ai cont?{" "}
          <a href="/register" className="text-blue-400 hover:underline">
            Înregistrare
          </a>
        </div>
      </div>
    </div>
  );
}
