//src/app/register/page.jsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    if (password !== confirmPwd) {
      setMessage("Parolele nu coincid.");
      return;
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();

    if (res.ok) {
      setMessage("Contul a fost creat! Redirecționare către login...");
      router.push("/login");
    } else {
      setMessage(data.msg || "Eroare la înregistrare.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="flex shadow-xl rounded-2xl overflow-hidden max-w-4xl w-full">
        {/* LEFT: FORMULAR */}
        <div className="w-full md:w-1/2 bg-gray-800 p-8 flex flex-col justify-center">
          <h1 className="text-3xl font-bold text-white text-center mb-6">Înregistrare</h1>
          {message && <p className="mb-4 text-red-400 text-center">{message}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white mb-1">Username</label>
              <input
                type="text"
                value={username}
                required
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Introduceți username"
              />
            </div>

            <div>
              <label className="block text-white mb-1">Email</label>
              <input
                type="email"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Introduceți email"
              />
            </div>

            <div>
              <label className="block text-white mb-1">Parolă</label>
              <input
                type="password"
                value={password}
                required
                minLength={6}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Introduceți parola"
              />
            </div>

            <div>
              <label className="block text-white mb-1">Confirmă parola</label>
              <input
                type="password"
                value={confirmPwd}
                required
                onChange={(e) => setConfirmPwd(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="Reintroduceți parola"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-gradient-to-r from-green-400 to-green-600 text-white font-semibold rounded-lg shadow hover:brightness-110 transition duration-200"
            >
              Creare cont
            </button>
          </form>
        </div>

        {/* RIGHT: Mesaj + vibe */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-600 text-white flex-col items-center justify-center p-8">
          <h2 className="text-4xl font-bold mb-4">Salutare!</h2>
          <p className="text-lg text-center leading-relaxed">
            Creează-ți contul și rezervă-ți terenul în doar câteva secunde.
          </p>
        </div>
      </div>
    </div>
  );
}