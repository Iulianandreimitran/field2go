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
    console.log(`🟢 Trimis joinUserRoom cu id ${session.user.id}`);

    socket.on("connect", () => {
      console.log("✅ Socket conectat");
      loadAll();
    });

    socket.on("invite:new", () => {
      console.log("🔔 Invitație nouă primită!");
      loadAll();
    });

    socket.on("friend-request:new", ({ request }) => {
      console.log("🔔 Cerere de prietenie nouă:", request);
      setFriendRequests(prev => [request, ...prev]);
    });

    return () => {
      socket.off("invite:new");
      socket.off("friend-request:new");
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

        if (socketRef.current) {
          socketRef.current.emit("reservation:trigger-update", reservationId);
        }

        window.dispatchEvent(new Event('inviteChanged')); // ⚡️ Anunțăm clopoțelul
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
        window.dispatchEvent(new Event('inviteChanged')); // ⚡️ Actualizăm clopoțelul
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
        window.dispatchEvent(new Event('inviteChanged')); // Actualizăm clopoțelul
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
        window.dispatchEvent(new Event('inviteChanged')); // Actualizăm clopoțelul
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
      <h1 className="text-3xl font-bold mb-8 text-center">Notificări</h1>

      {/* Cereri de prietenie */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-pink-500 mb-4">Cereri de prietenie</h2>
        {loadingFriendReq ? (
          <p className="text-gray-400">Se încarcă...</p>
        ) : friendRequests.length === 0 ? (
          <p className="text-gray-400">Nu ai cereri de prietenie noi.</p>
        ) : (
          <ul className="space-y-4">
            {friendRequests.map(req => (
              <li
                key={req._id}
                className="flex items-center justify-between bg-gray-800 px-5 py-4 rounded-xl shadow hover:shadow-lg transition"
              >
                <div className="flex items-center space-x-4">
                  {req.sender.avatar ? (
                    <Image
                      src={req.sender.avatar}
                      alt="avatar"
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-white font-bold">
                      {req?.sender?.username?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                  <p>
                    <span className="text-pink-400 font-semibold">
                      {req?.sender?.username || req?.sender?.name || "Utilizator necunoscut"}
                    </span>{" "}
                    ți-a trimis o cerere.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => acceptFriendRequest(req._id)}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:brightness-110 text-white px-4 py-1.5 rounded-lg text-sm"
                  >
                    Acceptă
                  </button>
                  <button
                    onClick={() => rejectFriendRequest(req._id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-sm"
                  >
                    Refuză
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Invitații la terenuri */}
      <section>
        <h2 className="text-2xl font-semibold text-blue-400 mb-4">Invitații la terenuri</h2>
        {loadingInvites ? (
          <p className="text-gray-400">Se încarcă...</p>
        ) : invites.length === 0 ? (
          <p className="text-gray-400">Nu ai invitații noi.</p>
        ) : (
          <div className="space-y-4">
            {invites.map(inv => (
              <div
                key={inv._id}
                className="bg-gray-800 px-5 py-4 rounded-xl shadow hover:shadow-lg transition"
              >
                <h3 className="text-xl font-semibold text-blue-300 mb-2">
                  {inv.field?.name || "Teren necunoscut"}
                </h3>
                <p><strong>Data:</strong> {new Date(inv.date).toLocaleDateString("ro-RO")}</p>
                <p><strong>Ora:</strong> {inv.startTime}</p>
                <p><strong>Organizator:</strong> {inv.owner?.username || inv.owner?.email}</p>

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    onClick={() => acceptInvite(inv._id)}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:brightness-110 text-white px-4 py-1.5 rounded-lg text-sm"
                  >
                    Acceptă
                  </button>
                  <button
                    onClick={() => declineInvite(inv._id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-sm"
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
