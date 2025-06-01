// app/users/search/page.jsx
"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('query') || '';
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!query) {
      setUsers([]);
      return;
    }
    async function fetchResults() {
      try {
        const res = await fetch(`/api/users/search?query=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        setUsers(data);
      } catch (error) {
        console.error('Eroare la fetch rezultate:', error);
      }
    }
    fetchResults();
  }, [query]);

  return (
    <div className="p-4 bg-gray-900 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-4">Rezultate pentru „{query}”</h1>
      {users.length === 0 ? (
        <p className="text-gray-400">Nu s-au găsit utilizatori.</p>
      ) : (
        <ul className="space-y-2">
          {users.map(user => (
            <li key={user.id} className="p-2 bg-gray-800 rounded hover:bg-gray-700">
              <Link href={`/users/${user.id}`}>
                <span>{user.name} ({user.email})</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
