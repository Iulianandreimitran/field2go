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

  const { field, owner, participants = [], invites = [], date, startTime, duration, isPublic, messages = [] } = reservation;
  const isOwner = session?.user && owner?._id === session.user.id;

  // Marchează ca public/privat (doar pentru owner)
  const handleTogglePublic = () => {
    const newStatus = !reservation.isPublic;
    // Actualizează în baza de date (API PATCH)
    fetch(`/api/reservations/${reservationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: newStatus })
    }).catch(err => console.error('Eroare la schimbarea statutului public:', err));
    // Actualizează imediat în UI
    setReservation(prev => ({ ...prev, isPublic: newStatus }));
  };

  // Trimitere invitație (doar pentru owner)
  const handleInvite = (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    fetch(`/api/reservations/${reservationId}/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail.trim() })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert(data.error);
        } else {
          // Dacă API-ul întoarce lista actualizată de invitați sau doar user-ul invitat:
          if (data.invites) {
            setReservation(prev => ({ ...prev, invites: data.invites }));
          } else if (data.invitedUser) {
            setReservation(prev => ({ ...prev, invites: [...prev.invites, data.invitedUser] }));
          }
          setInviteEmail('');  // goliți câmpul după trimitere
        }
      })
      .catch(err => {
        console.error('Eroare la trimiterea invitației:', err);
        alert('Eroare la trimiterea invitației.');
      });
  };

  const dateStr = new Date(date).toLocaleDateString();

  return (
    <div className="p-4 bg-gray-900 text-white min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Detalii Rezervare</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Coloană stângă: detalii + participanți */}
        <div>
          {/* Card detalii rezervare */}
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <h3 className="text-xl font-semibold mb-2">{field?.name}</h3>
            <p><strong>Organizator:</strong> {owner?.username || owner?.email}</p>
            <p>
              <strong>Data:</strong> {dateStr} <br/>
              <strong>Ora start:</strong> {startTime} <br/>
              <strong>Durată:</strong> {duration} ore
            </p>
            {isOwner ? (
              <p>
                <strong>Publică:</strong>
                <input
                  type="checkbox"
                  className="ml-2 align-middle"
                  checked={reservation.isPublic}
                  onChange={handleTogglePublic}
                /> {reservation.isPublic ? 'Public' : 'Privat'}
              </p>
            ) : (
              <p><strong>Publică:</strong> {isPublic ? 'Da' : 'Nu'}</p>
            )}
          </div>

          {/* Card participanți și invitați */}
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <h4 className="text-lg font-semibold mb-2">Participanți</h4>
            {participants.length === 0 ? (
              <p>{owner ? (owner.username || owner.email) : 'N/A'} (organizator)</p>
            ) : (
              <ul className="list-disc list-inside">
                {[owner, ...participants].map(u => (
                  <li key={u._id || u.email}>
                    {u.username || u.email}{u._id === owner?._id ? " (organizator)" : ""}
                  </li>
                ))}
              </ul>
            )}
            {invites.length > 0 && (
              <>
                <h4 className="text-lg font-semibold mt-3 mb-1">Invitații în așteptare</h4>
                <ul className="list-disc list-inside">
                  {invites.map(u => (
                    <li key={u._id || u.email}>{u.username || u.email}</li>
                  ))}
                </ul>
              </>
            )}
            {isOwner && (
              <form onSubmit={handleInvite} className="mt-3">
                <h5 className="font-semibold mb-1">Invită un utilizator:</h5>
                <div className="flex">
                  <input
                    type="email"
                    className="flex-1 px-2 py-1 rounded bg-white text-black"
                    placeholder="Email utilizator"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                  />
                  <button type="submit" className="ml-2 px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white">
                    Invită
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Coloană dreaptă: chat-ul live */}
        <div>
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <h4 className="text-lg font-semibold mb-2">Chat rezervare</h4>
            <ChatBox reservationId={reservationId} initialMessages={messages} />
          </div>
        </div>
      </div>
    </div>
  );
}
