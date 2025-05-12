// src/app/reservations/[id]/page.jsx
'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import ChatBox from '@/components/ChatBox';

export default function ReservationDetailPage() {
  const { id: reservationId } = useParams();
  const { data: session } = useSession();
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  // Încarcă detaliile rezervării
  useEffect(() => {
    if (!reservationId) return;
    setLoading(true);
    fetch(`/api/reservations/${reservationId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setErrorMsg(data.error);
        } else {
          setReservation(data);
        }
      })
      .catch(err => {
        console.error('Eroare la încărcarea detaliilor:', err);
        setErrorMsg('Eroare la încărcarea detaliilor.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [reservationId]);

  if (loading) {
    return <div className="p-4 text-white">Se încarcă detaliile rezervării...</div>;
  }
  if (errorMsg) {
    return <div className="p-4 text-red-400">{errorMsg}</div>;
  }
  if (!reservation) {
    return <div className="p-4 text-white">Rezervarea nu a fost găsită.</div>;
  }

  const {
    field,
    owner,
    participants = [],
    invites = [],
    date,
    startTime,
    duration,
    isPublic,
    messages = []
  } = reservation;
  const isOwner = session?.user?.id === owner?._id;

  const dateStr = new Date(date).toLocaleDateString();

  // Toggle public/private
  const handleTogglePublic = () => {
    const newStatus = !isPublic;
    fetch(`/api/reservations/${reservationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: newStatus })
    }).catch(err => console.error('Eroare la schimbarea statutului public:', err));
    setReservation(prev => ({ ...prev, isPublic: newStatus }));
  };

  // Trimite invitație
  const handleInvite = async (e) => {
    e.preventDefault();
    const email = inviteEmail.trim();
    if (!email) return;

    try {
      const res = await fetch(`/api/reservations/${reservationId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email })
      });

      if (!res.ok) {
        // încearcă să citească eroarea din JSON
        let errMsg = res.statusText;
        try {
          const errJson = await res.json();
          errMsg = errJson.error || JSON.stringify(errJson);
        } catch {}
        throw new Error(errMsg);
      }

      // doar dacă răspunsul este JSON îl decodăm
      const ct = res.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await res.json() : {};

      if (data.error) {
        alert(data.error);
      } else {
        if (data.invites) {
          setReservation(prev => ({ ...prev, invites: data.invites }));
        } else if (data.invitedUser) {
          setReservation(prev => ({
            ...prev,
            invites: [...prev.invites, data.invitedUser]
          }));
        } else {
          alert('Invitație trimisă!');
        }
        setInviteEmail('');
      }
    } catch (err) {
      console.error('Eroare la trimiterea invitației:', err);
      alert(err.message || 'Eroare la trimiterea invitației.');
    }
  };

  return (
    <div className="p-4 bg-gray-900 text-white min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Detalii Rezervare</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stânga: detalii + participanți */}
        <div>
          <div className="bg-gray-800 rounded-xl p-6 mb-6 shadow">
            <h3 className="text-2xl font-semibold mb-2">{field?.name}</h3>
            <p><strong>Organizator:</strong> {owner?.username || owner?.email}</p>
            <p className="mt-1">
              <strong>Data:</strong> {dateStr} <br/>
              <strong>Ora start:</strong> {startTime} <br/>
              <strong>Durată:</strong> {duration} ore
            </p>
            {isOwner ? (
              <label className="flex items-center mt-4">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={handleTogglePublic}
                  className="mr-2"
                />
                Publică rezervarea
              </label>
            ) : (
              <p className="mt-2"><strong>Publică:</strong> {isPublic ? 'Da' : 'Nu'}</p>
            )}
          </div>

          <div className="bg-gray-800 rounded-xl p-6 shadow">
            <h4 className="text-xl font-semibold mb-3">Participanți</h4>
            <ul className="list-disc list-inside space-y-1 mb-4">
              {[owner, ...participants].map(u => (
                <li key={u._id || u.email}>
                  {u.username || u.email}{u._id === owner?._id && ' (organizator)'}
                </li>
              ))}
            </ul>

            {invites.length > 0 && (
              <>
                <h4 className="text-xl font-semibold mb-2">Invitați în așteptare</h4>
                <ul className="list-disc list-inside space-y-1 mb-4">
                  {invites.map(u => (
                    <li key={u._id || u.email}>{u.username || u.email}</li>
                  ))}
                </ul>
              </>
            )}

            {isOwner && (
              <form onSubmit={handleInvite} className="mt-4">
                <div className="flex space-x-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="Email utilizator"
                    className="flex-1 px-3 py-2 rounded-lg text-gray-900"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
                  >
                    Invită
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Dreapta: chat live */}
        <div>
          <div className="bg-gray-800 rounded-xl p-6 shadow h-full">
            <h4 className="text-xl font-semibold mb-3">Chat rezervare</h4>
            <ChatBox reservationId={reservationId} initialMessages={messages} />
          </div>
        </div>
      </div>
    </div>
  );
}
