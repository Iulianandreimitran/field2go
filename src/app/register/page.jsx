//src/app/register/page.jsx
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
    setMessage("");

    // Trimite cererea POST către endpoint-ul de înregistrare
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();

    if (res.ok) {
      // Înregistrare reușită
      setMessage("Contul a fost creat! Redirecționare către login...");
      router.push("/login");
    } else {
      // Eroare (ex: 409 Email folosit, 400 date invalide, etc.)
      setMessage(data.msg || "Eroare la înregistrare.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <form onSubmit={handleSubmit} className="p-8 bg-gray-800 rounded shadow-md w-80">
        <h1 className="text-2xl font-bold mb-6 text-white text-center">Înregistrare</h1>
        {message && <p className="mb-4 text-red-400 text-center">{message}</p>}
        <div className="mb-4">
          <label className="block mb-1 text-white">Username</label>
          <input 
            type="text" value={username} required 
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 text-white" 
            placeholder="Introduceți username"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 text-white">Email</label>
          <input 
            type="email" value={email} required 
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 text-white" 
            placeholder="Introduceți email"
          />
        </div>
        <div className="mb-6">
          <label className="block mb-1 text-white">Parolă</label>
          <input 
            type="password" value={password} required minLength={6}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 text-white" 
            placeholder="Introduceți parola"
          />
        </div>
        <button type="submit" className="w-full py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-700">
          Creare cont
        </button>
      </form>
    </div>
  );
}
