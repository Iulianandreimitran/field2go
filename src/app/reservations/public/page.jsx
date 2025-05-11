// src/app/reservations/public/page.jsx
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PublicReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch('/api/reservations/public')  // API care returnează rezervările publice
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setErrorMsg(data.error);
        } else {
          setReservations(data);
        }
      })
      .catch(err => {
        console.error('Eroare la încărcarea rezervărilor publice:', err);
        setErrorMsg('Eroare la încărcarea rezervărilor publice.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-4 text-white">Se încarcă rezervările publice...</div>;
  }
  if (errorMsg) {
    return <div className="p-4 text-red-400">{errorMsg}</div>;
  }

  return (
    <div className="p-4 bg-gray-900 text-white min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Rezervări Publice</h2>
      {reservations.length === 0 ? (
        <p>Nu există rezervări publice disponibile.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reservations.map(res => {
            const dateStr = new Date(res.date).toLocaleDateString();
            return (
              <div key={res._id} className="bg-gray-800 rounded-lg p-4 flex flex-col justify-between">
                <div className="mb-2">
                  <h3 className="text-lg font-semibold">{res.field?.name || 'Teren'}</h3>
                  <p className="text-sm text-gray-300">
                    {dateStr} – {res.startTime}
                  </p>
                  {res.owner && (
                    <p className="text-sm text-gray-300">Organizator: {res.owner.username || res.owner.email}</p>
                  )}
                </div>
                <Link href={`/reservations/${res._id}`} className="mt-2 inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm text-center px-3 py-1 rounded">
                  Vizualizare
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
