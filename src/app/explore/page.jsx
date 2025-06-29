// src/app/explore/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import io from 'socket.io-client';

let socket;

export default function PublicReservationsPage() {
  const { data: session, status } = useSession();
  const [publicRes, setPublicRes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!socket) {
      socket = io('http://localhost:3001');
    }
  }, []);

  useEffect(() => {
    async function loadPublic() {
      setLoading(true);
      if (!session?.user) {
        setPublicRes([]);
        setLoading(false);
        return;
      }

      try {
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

  const now = new Date();
  const futureRes = publicRes.filter((resv) => {
    if (!resv.date || !resv.startTime) return false;
    const [Y, M, D] = resv.date.split('-').map((x) => parseInt(x, 10));
    const [h, m] = resv.startTime.split(':').map((x) => parseInt(x, 10));
    const resDateTime = new Date(Y, M - 1, D, h, m, 0);
    return resDateTime >= now;
  });

  const userId = session?.user?.id;
  const upcomingVisible = futureRes.filter((resv) => {
    if (resv.owner && resv.owner._id === userId) return false;
    if ((resv.participants || []).some((p) => p._id === userId)) return false;
    return true;
  });

  const handleJoin = async (resId) => {
    try {
      const res = await fetch(`/api/reservations/${resId}/join`, {
        method: 'POST',
        credentials: 'include'
      });

      if (res.ok) {
        setPublicRes((cur) => cur.filter((r) => r._id !== resId));
        alert('Te-ai alăturat rezervării cu succes!');
        socket?.emit("reservation:trigger-update", resId);
      } else {
        const data = await res.json();
        alert(data.error || 'Eroare la alăturare.');
      }
    } catch (err) {
      console.error('Eroare la alăturare:', err);
      alert('Eroare la alăturare.');
    }
  };

  if (status === "loading" || loading) {
    return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <p>Se încarcă rezervările publice…</p>
    </div>;
  }

  if (!session) {
    return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <p>Autentifică-te pentru a vedea rezervările publice.</p>
    </div>;
  }

  if (errorMsg) {
    return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <p className="text-red-400">{errorMsg}</p>
    </div>;
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
            const [Y, M, D] = resv.date.split('-').map((x) => parseInt(x, 10));
            const [h, m] = resv.startTime.split(':').map((x) => parseInt(x, 10));
            const dt = new Date(Y, M - 1, D, h, m, 0);
            const dateStr = dt.toLocaleDateString("ro-RO");
            const timeStr = resv.startTime;

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
                  <h2 className="text-2xl font-semibold text-purple-400 mb-2">
                    {resv.field?.name || "—"}
                  </h2>
                  <p className="text-gray-300 text-sm">
                    <span className="font-medium">Data:</span> {dateStr} |{" "}
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
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white font-semibold py-2 px-4 rounded-lg transition"
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
