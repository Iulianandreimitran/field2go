//src/app/admin/dashboard/[id]/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";

export default function FieldDetailsPage() {
  const { data: session } = useSession();
  const { id } = useParams(); // ✅ corect
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
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-4">
        Rezervări pentru: {field?.name || "Teren"}
      </h1>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Rezervări viitoare</h2>
        {future.length === 0 ? (
          <p>Nu sunt rezervări viitoare.</p>
        ) : (
          <ul className="space-y-2">
            {future.map((res) => (
              <li key={res._id} className="bg-green-900 p-3 rounded">
                {new Date(res.date).toLocaleString()} ·{" "}
                {res.owner?.username || "N/A"} ({res.owner?.email || "N/A"})
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Istoric rezervări</h2>
        {past.length === 0 ? (
          <p>Nu există rezervări anterioare.</p>
        ) : (
          <ul className="space-y-2">
            {past.map((res) => (
              <li key={res._id} className="bg-gray-800 p-3 rounded">
                {new Date(res.date).toLocaleString()} ·{" "}
                {res.owner?.username || "N/A"} ({res.owner?.email || "N/A"})
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
