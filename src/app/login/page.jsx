"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  // Gestionare login cu email/parolă
  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    // Apelăm NextAuth signIn cu provider-ul "credentials"
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setMessage("Eroare: " + res.error);
    } else {
      router.push("/dashboard");
    }
  }

  // Gestionare login cu Google
  function handleGoogleSignIn() {
    signIn("google", { callbackUrl: "/dashboard" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-white text-center mb-6">Autentificare</h1>
        {message && <p className="mb-4 text-red-400 text-center">{message}</p>}

        {/* Formular login credentials */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div>
            <label className="block text-white mb-1">Email</label>
            <input
              type="email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-white mb-1">Parolă</label>
            <input
              type="password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded"
              placeholder="Parola"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Log in
          </button>
        </form>

        {/* Buton login cu Google */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4"
        >
          Autentificare cu Google
        </button>

        {/* Link către registrare */}
        <p className="text-center text-white">
          Nu ai cont?{' '}
          <Link href="/register" className="text-blue-400 hover:underline">
            Înregistrează-te
          </Link>
        </p>
      </div>
    </div>
  );
}
