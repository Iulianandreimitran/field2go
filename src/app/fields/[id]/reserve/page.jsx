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
  const [loadingField, setLoadingField] = useState(true);
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
        setLoadingField(false);
      }
    }
    if (id) fetchField();
  }, [id]);


  useEffect(() => {
    async function loadReservations() {
      if (!id || !selectedDate) {
        setReservations([]);
        return;
      }
      try {
        const res = await fetch(
          `/api/reservations?field=${id}&date=${selectedDate}`
        );
        const data = await res.json();
        // `data` va fi un array de obiecte Reservation
        setReservations(data);
      } catch (error) {
        console.error("Eroare la încărcarea rezervărilor:", error);
        setReservations([]);
      }
    }
    loadReservations();
  }, [id, selectedDate]);

  const handleSlotClick = (hour) => {
    const hourString = String(hour).padStart(2, "0");
    setStartTime(`${hourString}:00`);
  };


  const handleReservationSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!session) {
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

    const payload = {
      fieldId:      id,
      reservedDate: selectedDate,
      startTime:    startTime,
      duration:     parseInt(duration, 10),
    };

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.reservation) {
        const newResId = data.reservation._id;
        router.push(`/payment?reservationId=${newResId}`);
      } else {
        setMessage(data.error || "Rezervare eșuată.");
      }
    } catch (error) {
      console.error("Eroare la rezervare:", error);
      setMessage("Eroare de server.");
    }
  };


  if (loadingField) {
    return <p className="p-4 text-white">Se încarcă datele terenului...</p>;
  }

  if (!field) {
    return <p className="p-4 text-white">Terenul nu a fost găsit.</p>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Buton „Înapoi” */}
      <button
        onClick={() => router.back()}
        className="mb-6 text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1.5 rounded hover:brightness-110 transition"
      >
        ← Înapoi
      </button>

      <div className="max-w-4xl mx-auto bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {/* Imagine teren */}
        {field.images && field.images.length > 0 && (
          <img
            src={field.images[0]}
            alt={field.name}
            className="w-full h-64 object-cover"
          />
        )}

        <div className="p-6">
          {/* Info teren */}
          <h1 className="text-3xl font-bold mb-2">{field.name}</h1>
          <p className="text-sm mb-1">
            <span className="font-semibold text-gray-300">Preț:</span>{" "}
            {field.pricePerHour} lei/oră
          </p>
          <p className="text-sm mb-6">
            <span className="font-semibold text-gray-300">Adresă:</span>{" "}
            {field.location}
          </p>

          {/* Selectare dată */}
          <div className="mb-6">
            <label className="block mb-1 font-medium text-white">Alege data:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setStartTime("");
              }}
              className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          {/* Orar dacă avem o zi selectată */}
          {selectedDate && (
            <>
              <h2 className="text-xl font-semibold mt-8 mb-3">
                Orarul pentru <span className="text-pink-400">{selectedDate}</span>
              </h2>
              <Timetable
                fieldId={id}
                date={selectedDate}
                startHour={8}
                endHour={22}
                onSlotClick={handleSlotClick}
              />
            </>
          )}

          {/* Form rezervare */}
          <h2 className="text-xl font-semibold mt-10 mb-4">Rezervă acest teren</h2>
          {message && <p className="mb-4 text-green-400 font-medium">{message}</p>}

          <form onSubmit={handleReservationSubmit} className="space-y-6">
            {/* Ora de start */}
            <div>
              <label className="block mb-1 font-medium text-white">Ora de start:</label>
              <input
                type="text"
                value={startTime}
                readOnly
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400"
                placeholder="Ex: 16:00"
              />
              <p className="text-sm text-gray-400 mt-1">
                (Click pe un slot disponibil din orar pentru a seta ora de start)
              </p>
            </div>

            {/* Durată */}
            <div>
              <label className="block mb-1 font-medium text-white">Durată (ore):</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white"
              >
                <option value="1">1 oră</option>
                <option value="2">2 ore</option>
                <option value="3">3 ore</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-pink-500 to-pink-700 hover:brightness-110 text-white py-2 rounded-lg font-semibold shadow-md transition"
            >
              Rezervă
            </button>
          </form>
        </div>
      </div>
    </div>
  );

}
