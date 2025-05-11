// src/app/explore/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function PublicReservationsPage() {
  const { data: session } = useSession();
  const [publicRes, setPublicRes] = useState([]);

  useEffect(() => {
    if (session?.user) {
      fetch('/api/reservations?public=true')
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) setPublicRes(data);
        })
        .catch((err) => console.error('Failed to load public reservations', err));
    }
  }, [session]);

  const handleJoin = async (resId) => {
    // găsim rezervarea
    const rez = publicRes.find((r) => r._id === resId);
    const userId = session.user.id;
    // verific dacă e owner sau deja participant
    const already =
      rez.owner._id === userId ||
      (rez.participants || []).some((p) => p._id === userId);
    if (already) {
      alert('Ești deja în această rezervare.');
      return;
    }

    // Alăturare normală
    try {
      const res = await fetch(`/api/reservations/${resId}/accept`, { method: 'POST' });
      if (res.ok) {
        setPublicRes((cur) => cur.filter((r) => r._id !== resId));
        alert('Te-ai alăturat rezervării!');
      } else {
        const { error } = await res.json();
        alert(error || 'Eroare la alăturare.');
      }
    } catch {
      alert('Eroare la alăturare.');
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <p>Autentifică-te pentru a vedea rezervările publice.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">Rezervări Publice</h1>
      {publicRes.length === 0 ? (
        <p className="text-gray-400">Nu există rezervări publice disponibile momentan.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {publicRes.map((res) => {
            // Verific dacă userul e deja în rezervare
            const userId = session.user.id;
            const isOwner = res.owner._id === userId;
            const isParticipant = (res.participants || []).some((p) => p._id === userId);
            const alreadyJoined = isOwner || isParticipant;

            return (
              <div
                key={res._id}
                className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow"
              >
                <div className="p-6">
                  <h2 className="text-2xl font-semibold text-pink-500 mb-2">
                    {res.field?.name || '—'}
                  </h2>
                  <p className="text-gray-300 text-sm">
                    <span className="font-medium">Data:</span>{' '}
                    {new Date(res.date).toLocaleDateString('ro-RO', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                    {' | '}
                    <span className="font-medium">Ora:</span> {res.startTime}
                  </p>
                  <p className="text-gray-300 text-sm mt-1">
                    <span className="font-medium">Durată:</span> {res.duration} ore
                  </p>
                  <p className="text-gray-300 text-sm mt-1">
                    <span className="font-medium">Organizator:</span> {res.owner.username}
                  </p>
                  <p className="text-gray-300 text-sm mt-1">
                    <span className="font-medium">Participanți:</span>{' '}
                    {(res.participants || [])
                      .map((p) => p.username || p.email)
                      .join(', ') || 'Doar owner-ul'}
                  </p>
                </div>
                <div className="bg-gray-700 px-6 py-4 flex justify-end">
                  {alreadyJoined ? (
                    <button
                      onClick={() => alert('Ești deja în această rezervare.')}
                      disabled
                      className="bg-gray-600 text-gray-300 font-semibold py-2 px-4 rounded-lg cursor-not-allowed"
                    >
                      Ești deja în această rezervare
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoin(res._id)}
                      className="bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                    >
                      Alătură-te
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
