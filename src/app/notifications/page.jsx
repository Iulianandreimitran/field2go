'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function NotificationsPage() {
  const { data: session } = useSession();
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) {
      setLoading(false);
      return;
    }
    fetch('/api/reservations?invited=true')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setInvites(data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [session]);

  const acceptInvite = async (id) => {
    try {
      const res = await fetch(`/api/reservations/${id}/accept`, { method: 'POST' });
      if (res.ok) {
        // remove from UI
        setInvites(prev => prev.filter(inv => inv._id !== id));
        // notify bell to refetch
        window.dispatchEvent(new Event('inviteChanged'));
      } else {
        console.error('Accept invitation failed');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const declineInvite = (id) => {
    // simply remove from UI
    setInvites(prev => prev.filter(inv => inv._id !== id));
    window.dispatchEvent(new Event('inviteChanged'));
    // optionally call an API to clear the invite
  };

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
          <p className="text-lg">Nu ai invitații noi.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {invites.map(inv => (
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
                  onClick={() => acceptInvite(inv._id)}
                  className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  Acceptă
                </button>
                <button
                  onClick={() => declineInvite(inv._id)}
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
