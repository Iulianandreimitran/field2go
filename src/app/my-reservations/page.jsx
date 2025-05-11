// src/app/my-reservations/page.jsx
'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function MyReservationsPage() {
  const { data: session } = useSession();
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    if (session?.user) {
      fetch('/api/reservations?mine=true')
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) setReservations(data);
        })
        .catch((err) => console.error('Failed to load reservations', err));
    }
  }, [session]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <p>Trebuie să fii autentificat pentru a vedea rezervările tale.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <h1 className="text-3xl font-bold text-white mb-6">Rezervările Mele</h1>

      {reservations.length === 0 ? (
        <p className="text-gray-300">Nu ai nicio rezervare momentan.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reservations.map((res) => (
            <div
              key={res._id}
              className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden transform hover:scale-[1.02] transition"
            >
              <div className="p-6 space-y-2">
                <h2 className="text-2xl font-semibold text-pink-500">
                  {res.field?.name || '–'}
                </h2>
                <p className="text-gray-300 text-sm">
                  <span className="font-medium">Data:</span>{' '}
                  {new Date(res.date).toLocaleDateString()}{' '}
                  <span className="font-medium">Ora:</span> {res.startTime}
                </p>
                <p className="text-gray-300 text-sm">
                  <span className="font-medium">Durată:</span> {res.duration} ore
                </p>
                <p className="text-gray-300 text-sm">
                  <span className="font-medium">Publică:</span>{' '}
                  {res.isPublic ? 'Da' : 'Nu'}
                </p>
                <p className="text-gray-300 text-sm">
                  <span className="font-medium">Participanți:</span>{' '}
                  {res.participants?.length
                    ? res.participants.map((p) => p.username || p.email).join(', ')
                    : 'Doar tu'}
                </p>
              </div>

              <div className="bg-gray-700 p-4 flex justify-end">
                <Link href={`/reservations/${res._id}`}>
                  <button className="bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-4 rounded-lg transition">
                    Detalii & Chat
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
