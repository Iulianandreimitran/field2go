// components/FriendList.jsx
'use client';

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function FriendList({ initialFriends }) {
  const [friends, setFriends] = useState(initialFriends);

  const handleDelete = async (friendId) => {
    try {
      const res = await fetch(`/api/friends/${friendId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errData = await res.json();
        console.error("Eroare la ștergerea prietenului, server a răspuns:", errData);
        return;
      }

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
          className="flex items-center justify-between bg-gray-800 px-6 py-4 rounded-xl shadow-md hover:shadow-lg transition"
        >
          {/* Stânga: Avatar + Nume */}
          <div className="flex items-center space-x-4">
            {friend.avatar ? (
              <Image
                src={friend.avatar}
                alt={`${friend.username} avatar`}
                width={48}
                height={48}
                className="rounded-full border-2 border-purple-500 shadow"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold text-lg shadow">
                {friend.username[0]?.toUpperCase() || "?"}
              </div>
            )}

            <span className="text-lg font-semibold text-white">{friend.username}</span>
          </div>

          {/* Dreapta: Acțiuni */}
          <div className="flex space-x-2">
            <Link href={`/chat/${friend._id}`}>
              <button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:brightness-110 text-white font-semibold px-4 py-1.5 rounded-lg text-sm transition">
                Mesaje
              </button>
            </Link>
            <button
              onClick={() => handleDelete(friend._id)}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-1.5 rounded-lg text-sm transition"
            >
              Șterge prieten
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
