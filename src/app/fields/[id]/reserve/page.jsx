// src/app/fields/[id]/reserve/page.jsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Timetable from "@/components/Timetable";

export default function ReserveFieldPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [field, setField] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Rezervările existente (într-un caz real, s-ar prelua via API; aici folosim date demo)
  const [reservations, setReservations] = useState([]);

  // Stări pentru data selectată și ora de start/durata
  const [selectedDate, setSelectedDate] = useState("");
  const [startTime, setStartTime] = useState("");  // ex. "19:00"
  const [duration, setDuration] = useState("2");   // durata în ore (implicit 2)

  // 1) Preluăm info despre terenul curent
  useEffect(() => {
    async function fetchField() {
      try {
        const res = await fetch(`/api/fields/${id}`);
        const data = await res.json();
        setField(data.field);
      } catch (error) {
        console.error("Eroare la preluarea terenului:", error);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchField();
  }, [id]);

  // 2) (Demo) Preluăm rezervările existente pentru teren – în producție am apela o rută API
  useEffect(() => {
    const demoReservations = [
      // Exemplu rezervare: 2025-06-02, ora 09:00-10:00
      { startTime: "2025-06-02T09:00:00", endTime: "2025-06-02T10:00:00" },
      // Exemplu rezervare: 2025-06-02, ora 14:00-16:00
      { startTime: "2025-06-02T14:00:00", endTime: "2025-06-02T16:00:00" },
      // Exemplu rezervare: 2025-06-03, ora 10:00-12:00 (altă zi)
      { startTime: "2025-06-03T10:00:00", endTime: "2025-06-03T12:00:00" },
    ];
    setReservations(demoReservations);
  }, []);

  // 3) Când utilizatorul dă click pe un slot liber din orar (Timetable), setăm ora de start selectată
  const handleSlotClick = (hour) => {
    const hourString = String(hour).padStart(2, "0"); // ex: 19 -> "19"
    setStartTime(`${hourString}:00`);
  };

  // 4) Submit rezervare
  const handleReservationSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!session) {
      // Dacă utilizatorul nu are sesiune NextAuth, verificăm token-ul JWT din login-ul personalizat
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        router.push("/login");
        return;
      }
      // Dacă există un token JWT, considerăm utilizatorul autentificat (nu redirecționăm)
    }

    if (!selectedDate) {
      setMessage("Te rog selectează data.");
      return;
    }
    if (!startTime) {
      setMessage("Te rog alege un slot orar liber.");
      return;
    }

    // Construim datele de început și sfârșit pe baza datei și orei selectate
    const [year, month, day] = selectedDate.split("-").map(Number);
    const [hour, minute] = startTime.split(":").map(Number);
    const startDate = new Date(year, month - 1, day, hour, minute, 0);
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + parseInt(duration, 10));

    const payload = {
      fieldId: id,
      reservedDate: selectedDate,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
    };

    try {
      const headers = { "Content-Type": "application/json" };
      // Dacă există un token JWT (login manual), îl adăugăm în antetul Authorization
      const jwtToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (jwtToken) {
        headers["Authorization"] = `Bearer ${jwtToken}`;
      }
      // Efectuăm cererea POST la /api/reservations, incluzând token-ul JWT (dacă există) și cookie-ul de sesiune (pentru NextAuth)
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Rezervarea a fost efectuată cu succes!");
        // Adăugăm noua rezervare în starea locală pentru actualizarea imediată a orarului (slotul devine roșu)
        const newReservation = data.reservation || payload;
        setReservations((prev) => [...prev, newReservation]);
      } else {
        setMessage(data.msg || "Rezervare eșuată");
      }
    } catch (error) {
      console.error("Eroare la rezervare:", error);
      setMessage("Eroare de server");
    }
  };

  if (loading) return <p>Se încarcă datele terenului...</p>;
  if (!field) return <p>Terenul nu a fost găsit.</p>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <button
        onClick={() => router.back()}
        className="mb-4 bg-blue-600 px-3 py-1 rounded hover:bg-blue-700"
      >
        Înapoi
      </button>

      <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded shadow">
        {field?.images?.length > 0 && (
          <img
            src={field.images[0]}
            alt={field.name}
            className="w-full h-64 object-cover rounded mb-4"
          />
        )}
        <h1 className="text-3xl font-bold mb-2">{field.name}</h1>
        <p className="mb-2">
          <strong>Preț:</strong> {field.pricePerHour} lei/oră
        </p>
        <p className="mb-4">
          <strong>Adresă:</strong> {field.location}
        </p>

        {/* Formular rezervare */}
        <div className="mb-6">
          <label className="block font-semibold mb-1">Alege data:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="p-2 rounded bg-gray-700 text-white w-full"
          />
        </div>

        <div className="mb-6">
          <label className="block font-semibold mb-1">Alege ora de start (click pe orar):</label>
          <Timetable
            reservations={reservations}
            date={selectedDate}
            startHour={8}
            endHour={22}
            onSlotClick={handleSlotClick}
          />
        </div>

        <form onSubmit={handleReservationSubmit}>
          <div className="mb-4">
            <label className="block font-semibold mb-1">Durată (ore):</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="p-2 rounded bg-gray-700 text-white"
            >
              <option value="1">1 oră</option>
              <option value="2">2 ore</option>
              <option value="3">3 ore</option>
            </select>
          </div>

          {message && <p className="mb-4">{message}</p>}

          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Rezervă
          </button>
        </form>
      </div>
    </div>
  );
}
