// src/app/explore/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function PublicReservationsPage() {
  const { data: session, status } = useSession();
  const [publicRes, setPublicRes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // 1. La mount, încărcăm toate rezervările publice (active), populate
  useEffect(() => {
    async function loadPublic() {
      setLoading(true);
      if (!session?.user) {
        setPublicRes([]);
        setLoading(false);
        return;
      }

      try {
        // Aici endpoint‐ul populate, după ce l-ai schimbat (cf. pasul 1)
        const res = await fetch('/api/reservations?public=true', {
          credentials: 'include'
        });
        const data = await res.json();
        if (data.error) {
          setErrorMsg(data.error);
          setPublicRes([]);
        } else {
          setPublicRes(data);
        }
      } catch (err) {
        console.error('Failed to load public reservations', err);
        setErrorMsg('Eroare la încărcarea rezervărilor publice.');
        setPublicRes([]);
      } finally {
        setLoading(false);
      }
    }
    loadPublic();
  }, [session]);

  // 2. Filtrăm rezervările: le ținem doar pe cele cu dată+ora >= now
  const now = new Date();
  const futureRes = publicRes.filter((resv) => {
    if (!resv.date || !resv.startTime) return false;
    const [Y, M, D] = resv.date.split('-').map((x) => parseInt(x, 10));
    const [h, m]      = resv.startTime.split(':').map((x) => parseInt(x, 10));
    const resDateTime = new Date(Y, M - 1, D, h, m, 0);
    return resDateTime >= now;
  });

  // 3. Aflăm ID‐ul curent al userului
  const userId = session?.user?.id;

  // 4. Eliminăm din acele futureRes card‐urile în care user‐ul e deja owner sau participant
  const upcomingVisible = futureRes.filter((resv) => {
    // owner‐ul
    if (resv.owner && resv.owner._id === userId) return false;
    // participanții
    if ((resv.participants || []).some((p) => p._id === userId)) return false;
    return true;
  });

  // 5. Handler pentru „Alătură‐te” (apelăm ruta /api/reservations/[id]/join)
  const handleJoin = async (resId) => {
    try {
      const res = await fetch(`/api/reservations/${resId}/join`, {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        // după ce am reușit să mă alătur, elimin rezervarea din lista de afișat
        setPublicRes((cur) => cur.filter((r) => r._id !== resId));
        alert('Te-ai alăturat rezervării cu succes!');
      } else {
        const data = await res.json();
        alert(data.error || 'Eroare la alăturare.');
      }
    } catch (err) {
      console.error('Eroare la alăturare:', err);
      alert('Eroare la alăturare.');
    }
  };

  // 6. Gestionăm stările de loading / unauthenticated / error
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Se încarcă rezervările publice…</p>
      </div>
    );
  }
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Autentifică-te pentru a vedea rezervările publice.</p>
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

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">Rezervări Publice</h1>

      {upcomingVisible.length === 0 ? (
        <p className="text-gray-400">
          Nu există rezervări publice viitoare (sau ești deja înscris la toate).
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {upcomingVisible.map((resv) => {
            // 7. Formatare data și oră
            const [Y, M, D] = resv.date.split('-').map((x) => parseInt(x, 10));
            const [h, m]      = resv.startTime.split(':').map((x) => parseInt(x, 10));
            const dt = new Date(Y, M - 1, D, h, m, 0);
            const dateStr = dt.toLocaleDateString("ro-RO", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            });
            const timeStr = resv.startTime;

            // 8. Extragem owner și participanți (fără owner în listă)
            const ownerUsername = resv.owner?.username || resv.owner?.email || "—";
            const participantsList = (resv.participants || [])
              .filter((p) => p._id !== resv.owner?._id)
              .map((p) => p.username || p.email);

            return (
              <div
                key={resv._id}
                className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow"
              >
                <div className="p-6">
                  <h2 className="text-2xl font-semibold text-pink-500 mb-2">
                    {resv.field?.name || '—'}
                  </h2>
                  <p className="text-gray-300 text-sm">
                    <span className="font-medium">Data:</span> {dateStr} {' | '}
                    <span className="font-medium">Ora:</span> {timeStr}
                  </p>
                  <p className="text-gray-300 text-sm mt-1">
                    <span className="font-medium">Durată:</span> {resv.duration} ore
                  </p>
                  <p className="text-gray-300 text-sm mt-1">
                    <span className="font-medium">Organizator:</span> {ownerUsername}
                  </p>
                  <p className="text-gray-300 text-sm mt-1">
                    <span className="font-medium">Participanți:</span>{" "}
                    {participantsList.length > 0
                      ? participantsList.join(", ")
                      : "Doar owner-ul"}
                  </p>
                </div>
                <div className="bg-gray-700 px-6 py-4 flex justify-end">
                  <button
                    onClick={() => handleJoin(resv._id)}
                    className="bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                  >
                    Alătură-te
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
