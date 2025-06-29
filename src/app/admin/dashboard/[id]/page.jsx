//src/app/admin/dashboard/[id]/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";

export default function FieldDetailsPage() {
  const { data: session } = useSession();
  const { id } = useParams();
  const [reservations, setReservations] = useState([]);
  const [field, setField] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const res = await fetch(`/api/reservations/field/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || "Eroare");

        setReservations(data.reservations);
        setField(data.field);
      } catch (err) {
        setError(err.message || "Eroare la încărcare.");
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === "admin") {
      fetchReservations();
    }
  }, [id, session]);

  const now = new Date();
  const future = reservations.filter((r) => new Date(r.date) > now);
  const past = reservations.filter((r) => new Date(r.date) <= now);

  if (loading) return <div className="text-white p-6">Se încarcă...</div>;
  if (error) return <div className="text-red-400 p-6">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white px-6 py-10">
      <h1 className="text-3xl font-bold mb-8">
        Rezervări pentru: <span className="text-purple-400">{field?.name || "Teren"}</span>
      </h1>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 text-green-400">Rezervări viitoare</h2>
        {future.length === 0 ? (
          <p className="text-gray-400">Nu sunt rezervări viitoare.</p>
        ) : (
          <ul className="space-y-3">
            {future.map((res) => (
              <li
                key={res._id}
                className="bg-gradient-to-r from-emerald-700 to-green-800 p-4 rounded-xl shadow flex flex-col sm:flex-row sm:justify-between sm:items-center"
              >
                <div>
                  <p className="text-sm text-white font-medium">
                    {new Date(res.date).toLocaleString("ro-RO", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>
                  <p className="text-sm text-gray-300">
                    {res.owner?.username || "N/A"} <span className="text-xs text-gray-400">({res.owner?.email})</span>
                  </p>
                </div>
                <span className="mt-2 sm:mt-0 inline-block bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  viitor
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-blue-400">Istoric rezervări</h2>
        {past.length === 0 ? (
          <p className="text-gray-400">Nu există rezervări anterioare.</p>
        ) : (
          <ul className="space-y-3">
            {past.map((res) => (
              <li
                key={res._id}
                className="bg-gray-800 p-4 rounded-xl shadow flex flex-col sm:flex-row sm:justify-between sm:items-center"
              >
                <div>
                  <p className="text-sm font-medium">
                    {new Date(res.date).toLocaleString("ro-RO", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>
                  <p className="text-sm text-gray-300">
                    {res.owner?.username || "N/A"} <span className="text-xs text-gray-400">({res.owner?.email})</span>
                  </p>
                </div>
                <span className="mt-2 sm:mt-0 inline-block bg-gray-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  istoric
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );

}
