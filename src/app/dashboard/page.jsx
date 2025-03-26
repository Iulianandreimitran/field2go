//src/app/dashboard/page.jsx
"use client";

import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();

  const handleViewFields = () => {
    router.push("/fields");
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center">
      <h1 className="text-3xl font-bold text-white mb-6">Bun venit!</h1>
      <button
        onClick={handleViewFields}
        className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Vezi terenuri sportive
      </button>
    </div>
  );
}