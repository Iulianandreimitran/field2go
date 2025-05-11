// src/components/NotificationBell.jsx
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function NotificationBell() {
  const [inviteCount, setInviteCount] = useState(0);

  useEffect(() => {
    // Obține numărul de invitații în așteptare
    fetch('/api/reservations?invited=true')
      .then(res => res.json())
      .then(data => {
        if (!data.error && Array.isArray(data)) {
          setInviteCount(data.length);
        }
      })
      .catch(err => console.error('Failed to fetch invites count', err));
  }, []);

  return (
    <Link href="/notifications" style={{ marginLeft: '1rem', textDecoration: 'none', color: 'white' }}>
      <span style={{ fontSize: '1.5rem', position: 'relative' }}>
        &#128276; {/* Emoji clopoțel; se poate înlocui cu iconiță SVG/font-awesome */}
        {inviteCount > 0 && (
          <span 
            style={{
              position: 'absolute', top: '-5px', right: '-10px',
              background: 'red', color: 'white', borderRadius: '50%',
              padding: '2px 6px', fontSize: '0.8rem'
            }}>
            {inviteCount}
          </span>
        )}
      </span>
    </Link>
  );
}
