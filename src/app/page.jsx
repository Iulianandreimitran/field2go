// src/app/page.jsx
"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
      <div className="text-center bg-gray-800 p-10 rounded-2xl shadow-xl max-w-xl w-full">
        <h1 className="text-4xl md:text-5xl font-bold text-pink-500 mb-4">Bine ai venit la Field2Go!</h1>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => router.push("/login")}
            className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-md font-medium"
          >
            Autentificare
          </button>
        </div>
      </div>
    </div>
  );
}
