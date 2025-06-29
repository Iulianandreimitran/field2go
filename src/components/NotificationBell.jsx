'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import io from 'socket.io-client';
import { useSession } from 'next-auth/react';

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const router = useRouter();
  const { data: session } = useSession();
  const socketRef = useRef(null);

  const fetchCount = async () => {
    try {
      const [invRes, friendRes] = await Promise.all([
        fetch('/api/reservations?invited=true'),
        fetch('/api/friend-request')
      ]);

      const invitedData = await invRes.json();
      const friendData = await friendRes.json();

      const invitesCount = Array.isArray(invitedData) ? invitedData.length : 0;
      const friendReqCount = Array.isArray(friendData?.received) ? friendData.received.length : 0;

      setCount(invitesCount + friendReqCount);

    } catch (e) {
      console.error('Failed to fetch notifications count', e);
    }
  };

  useEffect(() => {
    if (!session?.user?.id) return;

    fetchCount();

    const socket = io("http://localhost:3001");
    socketRef.current = socket;

    socket.emit("joinUserRoom", session.user.id);

    socket.on("invite:new", () => {
      console.log("🔔 Invitație nouă primită! Actualizez clopoțelul.");
      fetchCount();
    });

    socket.on("friend-request:new", () => {
      console.log("👥 Cerere de prietenie nouă! Actualizez clopoțelul.");
      fetchCount();
    });

    const onChange = () => fetchCount();
    window.addEventListener('inviteChanged', onChange);

    return () => {
      socket.off("invite:new");
      socket.off("friend-request:new");
      socket.disconnect();
      window.removeEventListener('inviteChanged', onChange);
    };
  }, [session?.user?.id]);

  return (
    <div
      className="ml-4 relative cursor-pointer"
      onClick={() => router.push('/notifications')}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 
             14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 
             0v.341C7.67 6.165 6 8.388 6 11v3.159c0 
             .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 
             3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      {count > 0 && (
        <span className="absolute top-0 right-0 block w-2 h-2 bg-red-600 rounded-full"></span>
      )}
    </div>
  );
}
