// src/components/FriendRequestButton.jsx
"use client";

import { useState } from "react";

export default function FriendRequestButton({ targetUserId }) {
  const [status, setStatus] = useState("idle"); // "idle" | "sending" | "sent" | "error"

  const handleSendRequest = async () => {
    setStatus("sending");
    try {
      // --- Schimbăm cîmpul JSON din { targetUserId } în { receiver: targetUserId } ---
      const res = await fetch("/api/friend-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiver: targetUserId }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error(data.error);
        setStatus("error");
        return;
      }
      setStatus("sent");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <button
        disabled
        className="bg-yellow-500 text-gray-900 px-4 py-2 rounded mb-4"
      >
        Cerere trimisă
      </button>
    );
  }
  if (status === "sending") {
    return (
      <button disabled className="bg-gray-600 text-gray-400 px-4 py-2 rounded mb-4">
        Se trimite...
      </button>
    );
  }
  // status === "idle" sau "error"
  return (
    <button
      onClick={handleSendRequest}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mb-4"
    >
      Trimite cerere de prietenie
    </button>
  );
}
