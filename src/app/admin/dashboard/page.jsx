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
    <div className="min-h-screen bg-gray-900 px-6 py-10 text-white">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard Admin</h1>
        <button
          onClick={() => router.push("/admin/add-field")}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:brightness-110 text-white px-5 py-2 rounded-lg font-semibold shadow"
        >
          ➕ Adaugă Teren
        </button>
      </div>

      {fields.length === 0 ? (
        <p className="text-gray-300">Nu ai terenuri încă. Adaugă unul din butonul de sus.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((field) => (
            <div
              key={field._id}
              className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition"
            >
              <div className="p-5">
                <h2 className="text-xl font-bold text-purple-400 mb-1">{field.name}</h2>
                <p className="text-gray-300 text-sm">{field.location} – {field.sportType}</p>
                <p className="text-gray-300 text-sm mt-1">Preț: {field.pricePerHour} lei/oră</p>
              </div>
              <div className="bg-gray-700 px-4 py-3 flex flex-wrap gap-2 justify-between items-center rounded-b-2xl">
                <button
                  onClick={() => router.push(`/admin/dashboard/${field._id}`)}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:brightness-110 text-white text-sm font-medium py-2 rounded-lg transition"
                >
                  Vezi rezervări
                </button>
                <button
                  onClick={() => router.push(`/admin/edit-field/${field._id}`)}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-600 hover:brightness-110 text-white text-sm font-medium py-2 rounded-lg transition"
                >
                  Editează
                </button>
                <button
                  onClick={() => handleDelete(field._id)}
                  className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:brightness-110 text-white text-sm font-medium py-2 rounded-lg transition"
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
