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
    console.log("Submit button pressed. Email:", email, "Password:", password);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      console.log("Response status:", res.status);

      let data;
      try {
        data = await res.json();
      } catch (err) {
        console.error("Răspuns invalid de la server (nu este JSON valid):", err);
        setMessage("Eroare: Răspuns invalid de la server.");
        return;
      }
      console.log("Response data:", data);

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username);

        // Emitere eveniment pentru actualizarea username-ului
        window.dispatchEvent(new Event("usernameUpdate"));

        setMessage("Autentificare reușită!");
        // Redirecționează utilizatorul; Header-ul va afișa noul nume doar după refresh
        router.push("/");
      } else {
        setMessage(data.msg || "Eroare la autentificare.");
      }
    } catch (error) {
      console.error("Eroare la trimiterea cererii:", error);
      setMessage("Eroare de rețea sau server.");
    }
  }
  
  function handleGoogleSignIn() {
    console.log("Google sign in clicked");
    signIn("google", { callbackUrl: "/" });
  }

  // login/page.jsx (doar secțiunea JSX relevantă)
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

        {/* Link-ul pentru înregistrare */}
        <div className="mt-4 text-center">
          <span className="text-white">
            Nu ai cont?{" "}
            <a href="/register" className="text-blue-400 hover:underline">
              Register
            </a>
          </span>
        </div>

      </div>
    </div>
  );
}