// src/app/reservations/[id]/page.jsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import ChatBox from "@/components/ChatBox";

export default function ReservationDetailsPage() {
  const { id: reservationId } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // ───────────────────────────────────────────────────────────
  //  Pentru „Invită un utilizator” (autocomplete + invite)
  // ───────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inviteUsername, setInviteUsername] = useState("");
  const suggestionsRef = useRef(null);

  // ───────────────────────────────────────────────────────────
  //  1) Încarcă detaliile rezervării de pe API
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!reservationId) return;
    setLoading(true);

    fetch(`/api/reservations/${reservationId}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setErrorMsg(data.error);
          setReservation(null);
        } else {
          setReservation(data);
        }
      })
      .catch((err) => {
        console.error("Eroare la încărcarea rezervării:", err);
        setErrorMsg("Eroare la încărcarea rezervării.");
        setReservation(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [reservationId]);

  // ───────────────────────────────────────────────────────────
  //  2) Handler: Părăsește rezervarea (leave)
  // ───────────────────────────────────────────────────────────
  const handleLeave = async () => {
    if (!window.confirm("Ești sigur(ă) că vrei să părăsești această rezervare?")) {
      return;
    }
    try {
      const res = await fetch(`/api/reservations/${reservationId}/leave`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        router.push("/my-reservations");
      } else {
        const data = await res.json();
        alert(data.error || "Eroare la părăsirea rezervării.");
      }
    } catch (err) {
      console.error("Eroare la leave:", err);
      alert("Eroare la părăsirea rezervării.");
    }
  };

  // ───────────────────────────────────────────────────────────
  //  3) Handler: Kick participant (numai owner)
  // ───────────────────────────────────────────────────────────
  const handleKick = async (kickUserId) => {
    if (!window.confirm("Ești sigur(ă) că vrei să elimini acest participant?")) {
      return;
    }
    try {
      const res = await fetch(`/api/reservations/${reservationId}/kick`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: kickUserId }),
      });
      if (res.ok) {
        setReservation((prev) => ({
          ...prev,
          participants: prev.participants.filter((p) => p._id !== kickUserId),
        }));
      } else {
        const data = await res.json();
        alert(data.error || "Eroare la kick participant.");
      }
    } catch (err) {
      console.error("Eroare la kick:", err);
      alert("Eroare la kick participant.");
    }
  };

  // ───────────────────────────────────────────────────────────
  //  4) Handler: Toggle public/private (numai owner)
  // ───────────────────────────────────────────────────────────
  const handleTogglePublic = async () => {
    if (!reservation) return;
    const newStatus = !reservation.isPublic;
    try {
      const res = await fetch(`/api/reservations/${reservationId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: newStatus }),
      });
      if (res.ok) {
        setReservation((prev) => ({
          ...prev,
          isPublic: newStatus,
        }));
      } else {
        const data = await res.json();
        alert(data.error || "Eroare la schimbarea statutului public.");
      }
    } catch (err) {
      console.error("Eroare la toggle public:", err);
      alert("Eroare la schimbarea statutului public.");
    }
  };

  // ───────────────────────────────────────────────────────────
  //  5) Autocomplete: căutare utilizatori după username/email
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    // Dacă nu avem minim 1 caracter, golim sugestiile
    if (searchTerm.trim().length < 1) {
      setSuggestions([]);
      return;
    }
    // Debounce: așteptăm 300ms înainte de a face fetch
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users?search=${encodeURIComponent(searchTerm)}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setSuggestions(data);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error("Eroare la fetch autocomplete:", err);
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ───────────────────────────────────────────────────────────
  //  6) Dacă clickuiești în afara dropdown-ului, ascundem sugestiile
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSuggestionClick = (username) => {
    setInviteUsername(username);
    setSearchTerm("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // ───────────────────────────────────────────────────────────
  //  7) Handler: Trimite invitație (numai owner)
  // ───────────────────────────────────────────────────────────
  const handleInvite = async (e) => {
    e.preventDefault();
    const identifier = inviteUsername.trim();
    if (!identifier) return;

    try {
      const res = await fetch(`/api/reservations/${reservationId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier }),
      });

      if (!res.ok) {
        let errMsg = res.statusText;
        try {
          const errJson = await res.json();
          errMsg = errJson.error || JSON.stringify(errJson);
        } catch {}
        throw new Error(errMsg);
      }

      // Actualizează starea rezervării cu lista nouă de `invites`
      // Dacă ruta `/invite` returnează deja `invitedUser` și `invites`, poți face:
      //    setReservation(prev => ({
      //      ...prev,
      //      invites: data.invites
      //    }));
      // Dar aici facem fetch complet ca să ne asigurăm că avem și celelalte câmpuri populate:
      const updated = await fetch(`/api/reservations/${reservationId}`, {
        credentials: "include",
      }).then((r) => r.json());
      setReservation(updated);

      setInviteUsername("");
      setSearchTerm("");
      setSuggestions([]);
      setShowSuggestions(false);
    } catch (err) {
      console.error("Eroare la trimiterea invitației:", err);
      alert(err.message || "Eroare la trimiterea invitației.");
    }
  };

  // ───────────────────────────────────────────────────────────
  //  Gestionarea stărilor de loading / eroare
  // ───────────────────────────────────────────────────────────
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Se încarcă detaliile rezervării…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Trebuie să fii autentificat pentru a vedea detaliile rezervării.</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="text-red-400">{errorMsg}</p>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Rezervarea nu a fost găsită.</p>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────
  //    Pregătim datele pentru afișare
  // ───────────────────────────────────────────────────────────
  const fieldName = reservation.field?.name || "—";
  const ownerUsername = reservation.owner?.username || reservation.owner?.email || "—";

  // Formatăm data din „YYYY-MM-DD” în „DD.MM.YYYY”
  const [Y, M, D] = reservation.date.split("-").map((x) => parseInt(x, 10));
  const [hh, mm] = reservation.startTime.split(":").map((x) => parseInt(x, 10));
  const dt = new Date(Y, M - 1, D, hh, mm, 0);
  const dateStr = dt.toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = reservation.startTime;

  // Construim lista de participanți, excluzând owner-ul
  const participantsList = (reservation.participants || [])
    .filter((p) => p._id !== reservation.owner?._id)
    .map((p) => ({
      id: p._id,
      username: p.username || p.email,
    }));

  const currentUserId = session.user.id;
  const isOwner = reservation.owner?._id === currentUserId;
  const isParticipant = (reservation.participants || [])
    .some((p) => p._id === currentUserId);

  // Pregătim mesajele inițiale pentru ChatBox
  const initialMessages = (reservation.messages || []).map((msg) => {
    const senderName =
      typeof msg.sender === "object"
        ? msg.sender.username || msg.sender.email || "User"
        : msg.sender;
    return {
      sender: senderName,
      text: msg.text,
      timestamp: msg.timestamp,
    };
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Detalii Rezervare</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ──────────────────────────────── */}
        {/*  1) Secțiunea de detalii rezervare  */}
        {/* ──────────────────────────────── */}
        <div className="bg-gray-800 rounded-2xl p-6 space-y-4 shadow">
          <h2 className="text-2xl font-semibold text-pink-500">{fieldName}</h2>
          <p>
            <span className="font-medium">Organizator:</span> {ownerUsername}
          </p>
          <p>
            <span className="font-medium">Data:</span> {dateStr}
          </p>
          <p>
            <span className="font-medium">Ora start:</span> {timeStr}
          </p>
          <p>
            <span className="font-medium">Durată:</span> {reservation.duration} ore
          </p>

          {/* ─────────────────────────────────────────── */}
          {/* Checkbox‐ul „Publică rezervarea” (numai owner) */}
          {/* ─────────────────────────────────────────── */}
          {isOwner ? (
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={reservation.isPublic}
                onChange={handleTogglePublic}
                className="mr-2"
              />
              Publică rezervarea
            </label>
          ) : (
            <p>
              <strong>Publică rezervarea:</strong>{" "}
              {reservation.isPublic ? "Da" : "Nu"}
            </p>
          )}

          {/* ─────────────────────────────────────────── */}
          {/* Lista de participanți */}
          {/* ─────────────────────────────────────────── */}
          <div>
            <h3 className="text-xl font-semibold mb-2">Participanți</h3>
            <ul className="list-disc list-inside space-y-1">
              {/* Afișăm owner‐ul mereu */}
              <li className="font-medium">
                {ownerUsername}{" "}
                <span className="text-sm text-gray-400">(organizator)</span>
              </li>
              {/* Afișăm restul participanților */}
              {participantsList.length > 0 &&
                participantsList.map((p) => (
                  <li
                    key={p.id}
                    className="flex justify-between items-center"
                  >
                    <span>{p.username}</span>
                    {isOwner && (
                      <button
                        onClick={() => handleKick(p.id)}
                        className="text-red-500 hover:text-red-600 text-sm"
                      >
                        Kick
                      </button>
                    )}
                  </li>
                ))}
            </ul>
          </div>

          {/* ─────────────────────────────────────────── */}
          {/*  Secțiunea „Invită un utilizator” (numai owner) */}
          {/* ─────────────────────────────────────────── */}
          {isOwner && (
            <div className="mt-4 relative" ref={suggestionsRef}>
              <label className="block mb-2 text-white font-medium">
                Invită utilizator
              </label>
              <input
                type="text"
                value={inviteUsername || searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setInviteUsername("");
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  if (suggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                placeholder="Scrie numele utilizatorului..."
                className="w-full px-3 py-2 rounded-lg text-gray-900 focus:outline-none"
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white text-black rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
                  {suggestions.map((user) => (
                    <li
                      key={user._id}
                      onClick={() => handleSuggestionClick(user.username)}
                      className="px-3 py-2 hover:bg-gray-200 cursor-pointer"
                    >
                      {user.username}{" "}
                      <span className="text-gray-500">({user.email})</span>
                    </li>
                  ))}
                </ul>
              )}
              <button
                onClick={handleInvite}
                disabled={!inviteUsername}
                className={`mt-2 w-full ${
                  inviteUsername
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-500 cursor-not-allowed"
                } text-white py-2 rounded-lg font-medium transition`}
              >
                Invită
              </button>
            </div>
          )}

          {/* ─────────────────────────────────────────── */}
          {/*  Buton „Părăsește rezervarea” (owner sau participant) */}
          {/* ─────────────────────────────────────────── */}
          {(isOwner || isParticipant) && (
            <div className="mt-6">
              <button
                onClick={handleLeave}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                Părăsește rezervarea
              </button>
            </div>
          )}
        </div>

        {/* ─────────────────────────────────────────── */}
        {/*  2) Secțiunea de chat live (ChatBox)        */}
        {/* ─────────────────────────────────────────── */}
        <div className="bg-gray-800 rounded-2xl p-6 shadow h-full flex flex-col">
          <h3 className="text-xl font-semibold mb-4">Chat rezervare</h3>
          <div className="flex-1 flex flex-col">
            <ChatBox
              reservationId={reservationId}
              initialMessages={initialMessages}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
