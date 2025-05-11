// src/app/notifications/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function NotificationsPage() {
  const { data: session } = useSession();
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return setLoading(false);
    fetch('/api/reservations?invited=true')
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setInvites(data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [session]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Trebuie să fii autentificat pentru notificări.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <h1 className="text-3xl font-bold text-white mb-6">Notificări</h1>

      {loading ? (
        <p className="text-gray-400">Se încarcă invitațiile…</p>
      ) : invites.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-16 text-gray-400">
          <svg
            className="w-16 h-16 mb-4 text-gray-600"
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <p className="text-lg">Nu ai invitații noi.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {invites.map((inv) => (
            <div
              key={inv._id}
              className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow"
            >
              <div className="p-6">
                <h2 className="text-xl font-semibold text-pink-500 mb-2">
                  Ai fost invitat la: {inv.field?.name}
                </h2>
                <p className="text-gray-300 text-sm">
                  <span className="font-medium">Data:</span>{' '}
                  {new Date(inv.date).toLocaleDateString('ro-RO', {
                    day: '2-digit', month: '2-digit', year: 'numeric'
                  })}{' '}
                  <span className="font-medium">Ora:</span> {inv.startTime}
                </p>
                <p className="text-gray-300 text-sm mt-1">
                  <span className="font-medium">Organizator:</span>{' '}
                  {inv.owner.username || inv.owner.email}
                </p>
              </div>
              <div className="bg-gray-700 px-6 py-4 flex justify-end space-x-3">
                <button
                  onClick={() => alert('Funcție ACCEPT de implementat')}
                  className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  Acceptă
                </button>
                <button
                  onClick={() => alert('Funcție REFUZ de implementat')}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  Refuză
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
