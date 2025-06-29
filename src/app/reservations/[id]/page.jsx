// src/app/reservations/[id]/page.jsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import ChatBox from "@/components/Chatbox";
import io from "socket.io-client";

export default function ReservationDetailsPage() {
  const { id: reservationId } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [inviteUsername, setInviteUsername] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);

  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io("http://localhost:3001");
    socketRef.current.emit("joinReservation", reservationId);

    socketRef.current.on("reservation:update", () => {
      fetchReservation();
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [reservationId]);

  const fetchReservation = async () => {
    try {
      const res = await fetch(`/api/reservations/${reservationId}`, {
        credentials: "include",
      });
      const data = await res.json();

      if (!data || data.error || !data._id) {
        setErrorMsg("Ai fost dat afară din rezervare.");
        setTimeout(() => router.push("/explore"), 3000);
        return;
      }

      setReservation(data);
    } catch (err) {
      setErrorMsg("Eroare la încărcarea rezervării.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reservationId) {
      fetchReservation();
    }
  }, [reservationId]);

  const currentUserId = session?.user?.id;
  const isOwner = reservation?.owner?._id === currentUserId;
  const isParticipant = reservation?.participants?.some((p) => p._id === currentUserId);

  const handleLeave = async () => {
    if (!confirm("Ești sigur că vrei să părăsești rezervarea?")) return;
    try {
      const res = await fetch(`/api/reservations/${reservationId}/leave`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        socketRef.current.emit("reservation:trigger-update", reservationId);
        router.push("/my-reservations");
      } else {
        const data = await res.json();
        alert(data.error || "Eroare la părăsire.");
      }
    } catch {
      alert("Eroare la părăsire.");
    }
  };

  const handleKick = async (userId) => {
    if (!confirm("Elimini acest participant?")) return;
    try {
      const res = await fetch(`/api/reservations/${reservationId}/kick`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        socketRef.current.emit("reservation:trigger-update", reservationId);
      }
    } catch {
      alert("Eroare la kick.");
    }
  };

  const handleTogglePublic = async () => {
    const newStatus = !reservation.isPublic;
    try {
      const res = await fetch(`/api/reservations/${reservationId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: newStatus }),
      });
      if (res.ok) {
        socketRef.current.emit("reservation:trigger-update", reservationId);
      }
    } catch {
      alert("Eroare la schimbare.");
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteUsername) return;

    try {
      const res = await fetch(`/api/reservations/${reservationId}/invite`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: inviteUsername }),
      });

      if (res.ok) {
        setInviteUsername("");
        setSearchTerm("");
        setSuggestions([]);
        setShowSuggestions(false);
        socketRef.current.emit("reservation:trigger-update", reservationId);
      } else {
        const data = await res.json();
        alert(data.error || "Eroare la invitație.");
      }
    } catch {
      alert("Eroare la invitație.");
    }
  };

  useEffect(() => {
    if (searchTerm.length < 1) return setSuggestions([]);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users?search=${searchTerm}`);
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
      } catch {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [Y, M, D] = reservation?.date?.split("-")?.map(Number) || [];
  const [hh, mm] = reservation?.startTime?.split(":")?.map(Number) || [];
  const dt = new Date(Y, M - 1, D, hh, mm);
  const dateStr = dt.toLocaleDateString("ro-RO");
  const timeStr = reservation?.startTime;

  const participantsList = reservation?.participants?.filter((p) => p._id !== reservation.owner?._id) || [];

  const initialMessages = reservation?.messages?.map((msg) => {
    const senderName = typeof msg.sender === "object"
      ? msg.sender.username || msg.sender.email || "User"
      : msg.sender;
    return { sender: senderName, text: msg.text, timestamp: msg.timestamp };
  }) || [];

  if (status === "loading" || loading) {
    return <div className="min-h-screen text-white p-6">Se încarcă...</div>;
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
        <p className="text-red-400 text-xl font-bold mb-4">{errorMsg}</p>
        <p className="text-gray-400">Vei fi redirecționat către rezervările publice…</p>
      </div>
    );
  }

  if (!reservation) return null;

  return (
  <div className="min-h-screen bg-gray-900 text-white p-8">
    <h1 className="text-3xl font-bold mb-6">Detalii Rezervare</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Secțiune info rezervare */}
      <div className="bg-gray-800 rounded-2xl p-6 shadow space-y-4">
        <h2 className="text-2xl font-semibold text-purple-400">{reservation.field?.name || "Teren"}</h2>
        <p className="text-sm"><strong>Data:</strong> {dateStr}</p>
        <p className="text-sm"><strong>Ora:</strong> {timeStr}</p>
        <p className="text-sm"><strong>Durată:</strong> {reservation.duration} ore</p>
        <p className="text-sm"><strong>Organizator:</strong> {reservation.owner?.username || "—"}</p>

        {isOwner && (
          <label className="inline-flex items-center text-sm">
            <input type="checkbox" checked={reservation.isPublic} onChange={handleTogglePublic} className="mr-2" />
            Publică rezervarea
          </label>
        )}

        <div>
          <h3 className="font-semibold mb-2 text-white">Participanți:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-200">
            <li>{reservation.owner?.username || "—"} <span className="text-gray-400">(organizator)</span></li>
            {participantsList.map((p) => (
              <li key={p._id} className="flex justify-between items-center">
                <span>{p.username || p.email}</span>
                {isOwner && (
                  <button
                    onClick={() => handleKick(p._id)}
                    className="text-red-400 hover:text-red-500 text-xs"
                  >
                    Kick
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Invitație – doar pentru owner */}
        {isOwner && (
          <div className="mt-4 relative" ref={suggestionsRef}>
            <label className="block mb-2 font-medium text-white text-sm">Invită utilizator</label>
            <input
              type="text"
              value={inviteUsername || searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setInviteUsername("");
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Scrie numele utilizatorului..."
              className="w-full px-3 py-2 rounded-lg bg-gray-700 text-gray-100 placeholder:text-gray-400 placeholder:italic"
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white text-black rounded-lg mt-1 max-h-48 overflow-y-auto shadow">
                {suggestions.map((user) => (
                  <li
                    key={user._id}
                    onClick={() => {
                      setInviteUsername(user.username);
                      setShowSuggestions(false);
                    }}
                    className="px-3 py-2 hover:bg-gray-200 cursor-pointer"
                  >
                    {user.username} <span className="text-gray-500">({user.email})</span>
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={handleInvite}
              disabled={!inviteUsername}
              className={`mt-3 w-full ${
                inviteUsername
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:brightness-110"
                  : "bg-gray-500 cursor-not-allowed"
              } text-white py-2 rounded-lg font-semibold transition`}
            >
              Invită
            </button>
          </div>
        )}

        {/* Leave button */}
        {(isOwner || isParticipant) && (
          <button
            onClick={handleLeave}
            className="mt-6 w-full bg-gradient-to-r from-red-500 to-pink-600 hover:brightness-110 text-white py-2 rounded-lg font-semibold transition"
          >
            Părăsește rezervarea
          </button>
        )}
      </div>

      {/* Secțiune Chat */}
      <div className="bg-gray-800 rounded-2xl p-6 shadow h-full flex flex-col">
        <h3 className="text-xl font-semibold mb-4">Chat rezervare</h3>
        <div className="flex-1">
          <ChatBox reservationId={reservationId} initialMessages={initialMessages} />
        </div>
      </div>
    </div>
  </div>
);

}
