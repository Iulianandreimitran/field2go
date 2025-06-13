//src/app/admin/dashboard/page.jsx
"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user || session.user.role !== "admin") {
      router.push("/");
      return;
    }

    const fetchFields = async () => {
      try {
        const res = await fetch("/api/fields/mine");
        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || "Eroare");
        setFields(data.fields);
      } catch (err) {
        setError(err.message || "Eroare la încărcarea terenurilor.");
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, [status, session, router]);

  async function handleDelete(fieldId) {
    if (!confirm("Sigur vrei să ștergi acest teren?")) return;

    try {
      const res = await fetch(`/api/fields/${fieldId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg);
      alert("Teren șters cu succes.");
      setFields((prev) => prev.filter((f) => f._id !== fieldId));
    } catch (err) {
      alert("Eroare la ștergere: " + err.message);
    }
  }

  if (loading) return <div className="text-white p-6">Se încarcă...</div>;
  if (error) return <div className="text-red-400 p-6">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">Dashboard Admin</h1>

      <button
        onClick={() => router.push("/admin/add-field")}
        className="mb-6 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
      >
        ➕ Adaugă Teren
      </button>

      {fields.length === 0 ? (
        <p className="text-white">Nu ai terenuri încă. Adaugă unul din meniul de sus.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((field) => (
            <div
              key={field._id}
              className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow"
            >
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-pink-500 mb-2">{field.name}</h2>
                <p className="text-gray-300 text-sm">
                  {field.location} – {field.sportType}
                </p>
                <p className="text-gray-300 text-sm mt-1">
                  Preț: {field.pricePerHour} lei/oră
                </p>
              </div>
              <div className="bg-gray-700 px-6 py-4 flex gap-2 justify-between">
                <button
                  onClick={() => router.push(`/admin/dashboard/${field._id}`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
                >
                  Vezi rezervări
                </button>
                <button
                  onClick={() => router.push(`/admin/edit-field/${field._id}`)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg"
                >
                  Editează
                </button>
                <button
                  onClick={() => handleDelete(field._id)}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg"
                >
                  Șterge
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
