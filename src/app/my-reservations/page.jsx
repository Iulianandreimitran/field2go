// src/app/my-reservations/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function MyReservationsPage() {
  const { data: session, status } = useSession();
  const [myRes, setMyRes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function loadReservations() {
      setLoading(true);

      if (!session?.user) {
        setMyRes([]);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/reservations?mine=true", {
          credentials: "include",
        });

        const contentType = res.headers.get("content-type") || "";

        if (!res.ok || !contentType.includes("application/json")) {
          const rawText = await res.text(); // pentru debug dacă vrei
          console.warn("Răspuns invalid sau neautorizat:", res.status, rawText);
          throw new Error("Nu s-au putut încărca rezervările.");
        }

        const data = await res.json();

        if (data.error) {
          setErrorMsg(data.error);
          setMyRes([]);
        } else {
          const azi = new Date();
          const filtrate = data.filter((r) => {
            const [y, m, d] = r.date.split("-").map((x) => parseInt(x, 10));
            const rezDate = new Date(y, m - 1, d);
            return rezDate >= new Date(azi.getFullYear(), azi.getMonth(), azi.getDate());
          });
          setMyRes(filtrate);
        }
      } catch (err) {
        console.error("Eroare la încărcarea rezervărilor mele:", err);
        setErrorMsg("Nu s-au putut încărca rezervările. Asigură-te că ești autentificat.");
        setMyRes([]);
      } finally {
        setLoading(false);
      }
    }

    loadReservations();
  }, [session]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Se încarcă rezervările mele…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Trebuie să fii autentificat pentru a vedea rezervările mele.</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-red-400">{errorMsg}</p>
      </div>
    );
  }

  if (myRes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <h1 className="text-3xl font-bold mb-6">Rezervările Mele</h1>
        <p className="text-gray-400">Nu ai nicio rezervare viitoare.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 px-6 py-10">
      <h1 className="text-4xl font-bold text-white mb-10">Rezervările Mele</h1>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {myRes.map((resv) => {
          const ownerUsername = resv.owner?.username || resv.owner?.email || "—";
          const participantsList = (resv.participants || [])
            .filter((p) => p._id !== resv.owner?._id)
            .map((p) => p.username || p.email);

          const [Y, M, D] = resv.date.split("-").map((x) => parseInt(x, 10));
          const [h, m] = resv.startTime.split(":").map((x) => parseInt(x, 10));
          const dt = new Date(Y, M - 1, D, h, m, 0);
          const dateStr = dt.toLocaleDateString("ro-RO", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });
          const timeStr = resv.startTime;

          return (
            <div
              key={resv._id}
              className="bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div className="p-6 space-y-2">
                <h2 className="text-xl font-bold text-violet-400 mb-2">{resv.field?.name || "—"}</h2>

                <p className="text-sm text-gray-300">
                  <span className="font-medium text-white">Data:</span> {dateStr} | <span className="font-medium text-white">Ora:</span> {timeStr}
                </p>
                <p className="text-sm text-gray-300">
                  <span className="font-medium text-white">Durată:</span> {resv.duration} ore
                </p>
                <p className="text-sm text-gray-300">
                  <span className="font-medium text-white">Publică:</span> {resv.isPublic ? "Da" : "Nu"}
                </p>
                <p className="text-sm text-gray-300">
                  <span className="font-medium text-white">Organizator:</span> {ownerUsername}
                </p>
                <p className="text-sm text-gray-300">
                  <span className="font-medium text-white">Participanți:</span>{" "}
                  {participantsList.length > 0 ? participantsList.join(", ") : "Doar owner-ul"}
                </p>
              </div>

              <div className="bg-gray-700 px-6 py-4 flex justify-end">
                <Link
                  href={`/reservations/${resv._id}`}
                  className="bg-gradient-to-r from-purple-600 to-violet-500 hover:brightness-110 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  Detalii & Chat
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

}
