'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import io from 'socket.io-client';

export default function NotificationsPage() {
  const { data: session } = useSession();
  const socketRef = useRef(null);

  const [invites, setInvites] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(true);

  const [friendRequests, setFriendRequests] = useState([]);
  const [loadingFriendReq, setLoadingFriendReq] = useState(true);

  const loadAll = async () => {
    if (!session?.user) return;

    // Invitatii la terenuri
    setLoadingInvites(true);
    try {
      const res = await fetch('/api/reservations?invited=true', { credentials: 'include' });
      const data = await res.json();
      setInvites(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Eroare la fetch invitații:', err);
    } finally {
      setLoadingInvites(false);
    }

    // Cereri de prietenie
    setLoadingFriendReq(true);
    try {
      const res = await fetch('/api/friend-request');
      const data = await res.json();
      setFriendRequests(Array.isArray(data.received) ? data.received : []);
    } catch (err) {
      console.error('Eroare la fetch friend requests:', err);
    } finally {
      setLoadingFriendReq(false);
    }
  };

  useEffect(() => {
    if (!session?.user?.id) return;

    const socket = io("http://localhost:3001");
    socketRef.current = socket;

    socket.emit("joinUserRoom", session.user.id);

    socket.on("connect", () => {
      console.log("✅ Socket conectat, încarc notificările...");
      loadAll(); // <--- apelăm doar după ce socketul e activ
    });

    socket.on("invite:new", () => {
      console.log("🔔 Invitație nouă primită!");
      loadAll();
    });

    return () => {
      socket.off("invite:new");
      socket.disconnect();
    };
  }, [session?.user?.id]);


  const acceptInvite = async (reservationId) => {
    try {
      const res = await fetch(`/api/reservations/${reservationId}/accept`, {
        method: 'POST',
        credentials: 'include'
      });

      if (res.ok) {
        setInvites(prev => prev.filter(inv => inv._id !== reservationId));

        // 🔔 Emită eveniment de update pentru pagina rezervării
        if (socketRef.current) {
          socketRef.current.emit("reservation:trigger-update", reservationId);
        }
      }
    } catch (err) {
      console.error('Accept invite error:', err);
    }
  };

  const declineInvite = async (reservationId) => {
  try {
    const res = await fetch(`/api/reservations/${reservationId}/decline`, {
      method: 'POST',
      credentials: 'include'
    });

    if (res.ok) {
      setInvites(prev => prev.filter(inv => inv._id !== reservationId));
    }
  } catch (err) {
    console.error("Decline invite error:", err);
  }
};

  const acceptFriendRequest = async (requestId) => {
    try {
      const res = await fetch(`/api/friend-request/${requestId}/accept`, { method: 'POST' });
      if (res.ok) {
        setFriendRequests(prev => prev.filter(fr => fr._id !== requestId));
      }
    } catch (err) {
      console.error('Accept friend error:', err);
    }
  };

  const rejectFriendRequest = async (requestId) => {
    try {
      const res = await fetch(`/api/friend-request/${requestId}/reject`, { method: 'POST' });
      if (res.ok) {
        setFriendRequests(prev => prev.filter(fr => fr._id !== requestId));
      }
    } catch (err) {
      console.error('Reject friend error:', err);
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
    <div className="min-h-screen bg-gray-900 py-8 px-4 text-white">
      <h1 className="text-3xl font-bold mb-6">Notificări</h1>

      {/* Cereri prietenie */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-pink-500 mb-4">Cereri de prietenie</h2>
        {loadingFriendReq ? (
          <p className="text-gray-400">Se încarcă...</p>
        ) : friendRequests.length === 0 ? (
          <p className="text-gray-400">Nu ai cereri de prietenie noi.</p>
        ) : (
          <ul className="space-y-4">
            {friendRequests.map(req => (
              <li key={req._id} className="flex items-center bg-gray-800 p-4 rounded shadow">
                {req.sender.avatar ? (
                  <Image
                    src={req.sender.avatar}
                    alt="avatar"
                    width={48}
                    height={48}
                    className="rounded-full mr-4"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-700 rounded-full mr-4" />
                )}
                <div className="flex-1">
                  <p>
                    <strong className="text-pink-400">{req.sender.username}</strong> ți-a trimis o cerere.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => acceptFriendRequest(req._id)} className="bg-green-600 px-3 py-1 rounded">
                    Acceptă
                  </button>
                  <button onClick={() => rejectFriendRequest(req._id)} className="bg-red-600 px-3 py-1 rounded">
                    Refuză
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Invitații rezervări */}
      <section>
        <h2 className="text-2xl font-semibold text-blue-400 mb-4">Invitații la terenuri</h2>
        {loadingInvites ? (
          <p className="text-gray-400">Se încarcă...</p>
        ) : invites.length === 0 ? (
          <p className="text-gray-400">Nu ai invitații noi.</p>
        ) : (
          <div className="space-y-4">
            {invites.map(inv => (
              <div key={inv._id} className="bg-gray-800 p-5 rounded-xl shadow">
                <h3 className="text-xl text-blue-300 font-semibold mb-1">{inv.field?.name || 'Teren necunoscut'}</h3>
                <p><strong>Data:</strong> {new Date(inv.date).toLocaleDateString('ro-RO')}</p>
                <p><strong>Ora:</strong> {inv.startTime}</p>
                <p><strong>Organizator:</strong> {inv.owner?.username || inv.owner?.email}</p>
                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => acceptInvite(inv._id)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                  >
                    Acceptă
                  </button>
                  <button
                    onClick={() => declineInvite(inv._id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                  >
                    Refuză
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
