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


  const [reservations, setReservations] = useState([]);


  const [selectedDate, setSelectedDate] = useState("");
  const [startTime, setStartTime] = useState("");  
  const [duration, setDuration] = useState("2");   


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


  useEffect(() => {
    const demoReservations = [

      {
        startTime: "2025-06-02T09:00:00",
        endTime: "2025-06-02T10:00:00",
      },

      {
        startTime: "2025-06-02T14:00:00",
        endTime: "2025-06-02T16:00:00",
      },

      {
        startTime: "2025-06-03T10:00:00",
        endTime: "2025-06-03T12:00:00",
      },
    ];
    setReservations(demoReservations);
  }, []);


  const handleSlotClick = (hour) => {

    const hourString = String(hour).padStart(2, "0");
    setStartTime(`${hourString}:00`);
  };


const handleReservationSubmit = async (e) => {
  e.preventDefault();
  setMessage("");


  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!session && !token) {
    router.push("/login");
    return;
  }

  if (!selectedDate) {
    setMessage("Te rog selectează data.");
    return;
  }
  if (!startTime) {
    setMessage("Te rog alege un slot orar liber.");
    return;
  }


  const [year, month, day] = selectedDate.split("-").map(Number);
  const [hour, minute] = startTime.split(":").map(Number);
  const startDate = new Date(year, month - 1, day, hour, minute, 0);
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + parseInt(duration, 10));

  const payload = {
    fieldId: id,
    reservedDate: selectedDate,
    startTime,
    duration: parseInt(duration)
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

      const newReservation = data.reservation || payload;

      router.push(`/payment?reservationId=${newReservation._id}`);
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
        {field.images && field.images.length > 0 && (
          <img
            src={field.images[0]}
            alt={field.name}
            className="w-full h-64 object-cover rounded mb-4"
          />
        )}
        <h1 className="text-3xl font-bold mb-2">{field.name}</h1>
        <p className="mb-2"><strong>Preț:</strong> {field.pricePerHour} lei/oră</p>
        <p className="mb-4"><strong>Adresă:</strong> {field.location}</p>

        <div className="mb-6">
          <label className="block font-semibold mb-1">Alege data:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setStartTime(""); // resetăm startTime dacă se schimbă data
            }}
            className="p-2 text-black rounded"
          />
        </div>

        {selectedDate && (
          <>
            <h2 className="text-2xl font-semibold mt-2 mb-4">
              Orarul Terenului pentru {selectedDate}
            </h2>
            <Timetable
              reservations={reservations}
              date={selectedDate}
              startHour={8}
              endHour={22}
              onSlotClick={handleSlotClick}
            />
          </>
        )}

        <h2 className="text-2xl font-semibold mt-6 mb-4">Rezervă acest teren</h2>
        {message && <p className="mb-4 text-green-400">{message}</p>}
        <form onSubmit={handleReservationSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-semibold">Ora de start:</label>
            <input
              type="text"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full p-2 text-black rounded"
              placeholder="Ex: 16:00"
              readOnly
            />
            <p className="text-sm text-gray-400">
              (Dă click pe un slot verde din orar pentru a seta ora de start)
            </p>
          </div>

          <div>
            <label className="block mb-1 font-semibold">Durată (ore):</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full p-2 text-black rounded"
            >
              <option value="1">1 oră</option>
              <option value="2">2 ore</option>
              <option value="3">3 ore</option>
            </select>
          </div>

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
