// src/app/reservations/page.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function PublicReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/reservations?public=true", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setErrorMsg(data.error);
          setReservations([]);
        } else {
          setReservations(data);
        }
      })
      .catch((err) => {
        console.error("Eroare la încărcarea rezervărilor publice:", err);
        setErrorMsg("Eroare la încărcarea rezervărilor publice.");
        setReservations([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-4 text-white">Se încarcă rezervările publice...</div>;
  }
  if (errorMsg) {
    return <div className="p-4 text-red-400">{errorMsg}</div>;
  }


  const now = new Date();
  const upcoming = reservations.filter((res) => {
    const [Y, M, D] = res.date.split("-").map((x) => parseInt(x, 10));
    const [h, m] = res.startTime.split(":").map((x) => parseInt(x, 10));
    const dt = new Date(Y, M - 1, D, h, m, 0);
    return dt >= now;
  });

  return (
    <div className="p-4 bg-gray-900 text-white min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Rezervări Publice</h2>
      {upcoming.length === 0 ? (
        <p>Nu există rezervări publice disponibile în viitor.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcoming.map((res) => {
            const [Y, M, D] = res.date.split("-").map((x) => parseInt(x, 10));
            const [h, m] = res.startTime.split(":").map((x) => parseInt(x, 10));
            const dt = new Date(Y, M - 1, D, h, m, 0);
            const dateStr = dt.toLocaleDateString("ro-RO", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            });
            const timeStr = dt.toLocaleTimeString("ro-RO", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={res._id}
                className="bg-gray-800 rounded-lg p-4 flex flex-col justify-between"
              >
                <div className="mb-2">
                  <h3 className="text-lg font-semibold">{res.field?.name || "Teren"}</h3>
                  <p className="text-sm text-gray-300">
                    {dateStr} – {timeStr}
                  </p>
                  {res.owner && (
                    <p className="text-sm text-gray-300">
                      Organizator: {res.owner.username || res.owner.email}
                    </p>
                  )}
                </div>
                <Link
                  href={`/reservations/${res._id}`}
                  className="mt-2 inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm text-center px-3 py-1 rounded"
                >
                  Vizualizare
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
