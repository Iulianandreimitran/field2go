'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const router = useRouter();

  // Fetch how many invites are pending
  const fetchCount = async () => {
    try {
      const res = await fetch('/api/reservations?invited=true');
      if (!res.ok) return;
      const data = await res.json();
      setCount(Array.isArray(data) ? data.length : 0);
    } catch (e) {
      console.error('Failed to fetch invite count', e);
    }
  };

  useEffect(() => {
    fetchCount();
    // Listen for any invite changes (accept/decline)
    const onChange = () => fetchCount();
    window.addEventListener('inviteChanged', onChange);
    return () => window.removeEventListener('inviteChanged', onChange);
  }, []);

  return (
    <div
      className="ml-4 relative cursor-pointer"
      onClick={() => router.push('/notifications')}
    >
      {/* Bell icon (you can swap for your SVG) */}
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
