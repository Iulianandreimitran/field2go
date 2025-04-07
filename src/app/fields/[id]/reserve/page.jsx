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

  // Rezervările existente
  const [reservations, setReservations] = useState([]);

  // Stări pentru data selectată și ora de start/durata
  const [selectedDate, setSelectedDate] = useState("");
  const [startTime, setStartTime] = useState("");  // ex. "14:00"
  const [duration, setDuration] = useState("2");   // default 2 ore

  // 1) Preluăm info despre teren
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

  // 2) (Demo) Preluăm rezervările existente – în producție le vei prelua din API
  useEffect(() => {
    const demoReservations = [
      { startTime: "2025-06-02T09:00:00", endTime: "2025-06-02T10:00:00" },
      { startTime: "2025-06-02T14:00:00", endTime: "2025-06-02T16:00:00" },
      { startTime: "2025-06-03T10:00:00", endTime: "2025-06-03T12:00:00" },
    ];
    setReservations(demoReservations);
  }, []);

  // 3) Când se face click pe un slot liber din Timetable, setăm ora de start
  const handleSlotClick = (hour) => {
    const hourString = String(hour).padStart(2, "0");
    setStartTime(`${hourString}:00`);
  };

  // 4) Submit rezervare
  const handleReservationSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // Validare: rezervările se pot face doar pentru date viitoare
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const chosenDate = new Date(selectedDate);
    if (chosenDate < today) {
      setMessage("Rezervările se pot face doar pentru date viitoare.");
      return;
    }

    // Verificăm dacă suntem autentificați – fie prin NextAuth, fie manual cu token
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!session && !token) {
      router.push("/login");
      return;
    }

    // Verificăm dacă data și ora sunt selectate
    if (!selectedDate) {
      setMessage("Te rog selectează data.");
      return;
    }
    if (!startTime) {
      setMessage("Te rog alege un slot orar liber.");
      return;
    }

    // Construim datele de început și sfârșit
    const [year, month, day] = selectedDate.split("-").map(Number);
    const [hour, minute] = startTime.split(":").map(Number);
    const startDate = new Date(year, month - 1, day, hour, minute, 0);
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + parseInt(duration, 10));

    // Construim payload-ul pentru rezervare (status va fi "pending" setat pe server)
    const payload = {
      fieldId: id,
      reservedDate: selectedDate,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
    };

    try {
      const headers = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        // Rezervare creată cu succes => calculează suma totală de plată
        // Folosim prețul terenului (pricePerHour) și durata rezervată
        const totalPriceLei = field.pricePerHour * parseInt(duration, 10); // ex. 240 lei
        const amountInBani = totalPriceLei * 100; // Stripe așteaptă suma în cenți
        // Redirecționăm către pagina de plată cu reservationId și amount ca parametri
        router.push(`/payment?reservationId=${data.reservation._id}&amount=${amountInBani}`);
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

        <div className="mb-6">
          <label className="block font-semibold mb-1">Alege data:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setStartTime("");
            }}
            className="p-2 rounded bg-gray-700 text-white w-full"
          />
        </div>

        {selectedDate && (
          <>
            <label className="block font-semibold mb-1">
              Alege ora de start (click pe orar):
            </label>
            <Timetable
              reservations={reservations}
              date={selectedDate}
              startHour={8}
              endHour={22}
              onSlotClick={handleSlotClick}
            />
          </>
        )}

        <form onSubmit={handleReservationSubmit} className="mt-4">
          <div className="mb-4">
            <label className="block font-semibold mb-1">
              Ora de start selectată:
            </label>
            <input
              type="text"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="p-2 rounded bg-gray-700 text-white w-full"
              readOnly
            />
          </div>

          <div className="mb-4">
            <label className="block font-semibold mb-1">Durată (ore):</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="p-2 rounded bg-gray-700 text-white w-full"
            >
              <option value="1">1 oră</option>
              <option value="2">2 ore</option>
              <option value="3">3 ore</option>
            </select>
          </div>

          {message && <p className="mb-4 text-red-400">{message}</p>}

          <button
            type="submit"
            className="bg-pink-600 px-4 py-2 rounded hover:bg-pink-700"
          >
            Rezervă
          </button>
        </form>
      </div>
    </div>
  );
}
