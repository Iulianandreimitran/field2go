// src/app/notifications/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

export default function NotificationsPage() {
  const { data: session } = useSession();
  
  // State pentru invitațiile la terenuri
  const [ invites, setInvites ] = useState([]);
  const [ loadingInvites, setLoadingInvites ] = useState(true);

  // State pentru cererile de prietenie
  const [ friendRequests, setFriendRequests ] = useState([]);
  const [ loadingFriendReq, setLoadingFriendReq ] = useState(true);

  useEffect(() => {
    if (!session?.user) {
      // dacă nu e user logat, nu apelăm niciun API
      setLoadingInvites(false);
      setLoadingFriendReq(false);
      return;
    }

    // 1. Fetch invitații la terenuri
    setLoadingInvites(true);
    fetch('/api/reservations?invited=true')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setInvites(data);
        } else {
          console.error('Error fetching reservation invites:', data.error);
        }
      })
      .catch(err => {
        console.error('Error fetching reservation invites:', err);
      })
      .finally(() => {
        setLoadingInvites(false);
      });

    // 2. Fetch cereri de prietenie
    setLoadingFriendReq(true);
    fetch('/api/friend-request')
      .then(res => res.json())
      .then(data => {
        if (!data.error && data.received) {
          // API-ul nostru GET /api/friend-request răspunde cu:
          // { received: [ ... ], sent: [ ... ] }
          setFriendRequests(data.received);
        } else {
          // Dacă nu avem `received`, îl tratăm că nu sunt cereri
          console.error('Error fetching friend requests:', data.error);
        }
      })
      .catch(err => {
        console.error('Error fetching friend requests:', err);
      })
      .finally(() => {
        setLoadingFriendReq(false);
      });
  }, [session]);

  const acceptInvite = async (id) => {
    try {
      const res = await fetch(`/api/reservations/${id}/accept`, { method: 'POST' });
      if (res.ok) {
        setInvites(prev => prev.filter(inv => inv._id !== id));
        window.dispatchEvent(new Event('inviteChanged'));
      } else {
        console.error('Accept invitation failed');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const declineInvite = (id) => {
    setInvites(prev => prev.filter(inv => inv._id !== id));
    window.dispatchEvent(new Event('inviteChanged'));
    // Aici, opțional, ai putea face un call la un endpoint care marchează invitația ca „respinsă”
  };

  const acceptFriendRequest = async (requestId) => {
    try {
      const res = await fetch(`/api/friend-request/${requestId}/accept`, { method: 'POST' });
      if (res.ok) {
        setFriendRequests(prev => prev.filter(fr => fr._id !== requestId));
      } else {
        console.error('Accept friend request failed');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const rejectFriendRequest = async (requestId) => {
    try {
      const res = await fetch(`/api/friend-request/${requestId}/reject`, { method: 'POST' });
      if (res.ok) {
        setFriendRequests(prev => prev.filter(fr => fr._id !== requestId));
      } else {
        console.error('Reject friend request failed');
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Trebuie să fii autentificat pentru a vedea notificările.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <h1 className="text-3xl font-bold text-white mb-6">Notificări</h1>

      {/* ------------------------------------------------------ */}
      {/* 1. Secțiunea de Cereri de prietenie (Friend Requests) */}
      {/* ------------------------------------------------------ */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-pink-500 mb-4">Cereri de prietenie</h2>

        {loadingFriendReq ? (
          <p className="text-gray-400">Se încarcă cererile de prietenie...</p>
        ) : friendRequests.length === 0 ? (
          <p className="text-gray-400">Nu ai cereri de prietenie noi.</p>
        ) : (
          <ul className="space-y-4">
            {friendRequests.map(req => (
              <li
                key={req._id}
                className="flex items-center bg-gray-800 p-4 rounded-lg shadow"
              >
                {/* Avatar expeditor */}
                {req.sender.avatar ? (
                  <Image
                    src={req.sender.avatar}
                    alt={`${req.sender.username} avatar`}
                    width={48}
                    height={48}
                    className="rounded-full mr-4"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-700 rounded-full mr-4" />
                )}

                <div className="flex-1">
                  <p>
                    <strong className="text-pink-400">{req.sender.username}</strong>{' '}
                    ți-a trimis o cerere de prietenie.
                  </p>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => acceptFriendRequest(req._id)}
                    className="px-3 py-1 bg-green-500 hover:bg-green-600 rounded text-white transition"
                  >
                    Acceptă
                  </button>
                  <button
                    onClick={() => rejectFriendRequest(req._id)}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded text-white transition"
                  >
                    Respinge
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ------------------------------------------------------ */}
      {/* 2. Secțiunea de Invitații la terenuri (Field Invites)  */}
      {/* ------------------------------------------------------ */}
      <div>
        <h2 className="text-2xl font-semibold text-blue-400 mb-4">Invitații la terenuri</h2>

        {loadingInvites ? (
          <p className="text-gray-400">Se încarcă invitațiile la terenuri...</p>
        ) : invites.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-8 text-gray-400">
            <p className="text-lg">Nu ai invitații noi la terenuri.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {invites.map(inv => (
              <div
                key={inv._id}
                className="bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow"
              >
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-blue-300 mb-2">
                    Ai fost invitat la: <span className="text-white">{inv.field?.name}</span>
                  </h2>
                  <p className="text-gray-300 text-sm">
                    <span className="font-medium">Data:</span>{' '}
                    {new Date(inv.date).toLocaleDateString('ro-RO', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
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
    </div>
  );
}
