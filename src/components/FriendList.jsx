// components/FriendList.jsx
'use client';

import { useState } from "react";
import Image from "next/image";

export default function FriendList({ initialFriends }) {
  const [friends, setFriends] = useState(initialFriends);

  const handleDelete = async (friendId) => {
    try {
      const res = await fetch(`/api/friends/${friendId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        // Aici prindem răspunsul 400 și îl logăm în detaliu
        const errData = await res.json();
        console.error("Eroare la ștergerea prietenului, server a răspuns:", errData);
        return;
      }

      // Dacă răspunsul este ok, scoatem prietenul din state
      setFriends((prev) => prev.filter((f) => f._id !== friendId));
    } catch (err) {
      console.error("Eroare la fetch DELETE prieten:", err);
    }
  };

  if (friends.length === 0) {
    return <p className="text-gray-400">Nu ai prieteni în listă.</p>;
  }

  return (
    <ul className="space-y-4">
      {friends.map((friend) => (
        <li
          key={friend._id}
          className="flex items-center justify-between bg-gray-800 p-4 rounded-lg shadow"
        >
          <div className="flex items-center">
            {friend.avatar ? (
              <Image
                src={friend.avatar}
                alt={`${friend.username} avatar`}
                width={48}
                height={48}
                className="rounded-full mr-4 border-2 border-pink-500"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-700 rounded-full mr-4" />
            )}
            <span className="text-white font-medium text-lg">{friend.username}</span>
          </div>
          <button
            onClick={() => handleDelete(friend._id)}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            Șterge prieten
          </button>
        </li>
      ))}
    </ul>
  );
}
