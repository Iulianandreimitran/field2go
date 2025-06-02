// src/app/fields/[id]/reserve/page.jsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Timetable from "@/components/Timetable";

export default function ReserveFieldPage() {
  const { id } = useParams();           // ID-ul terenului extras din URL
  const router = useRouter();
  const { data: session } = useSession();

  const [field, setField] = useState(null);
  const [loadingField, setLoadingField] = useState(true);
  const [message, setMessage] = useState("");

  // Rezervările existente (vor încărca doar pentru ziua selectată)
  const [reservations, setReservations] = useState([]);

  // Stări pentru data selectată, ora și durata
  const [selectedDate, setSelectedDate] = useState("");  // ex: "2025-06-21"
  const [startTime, setStartTime] = useState("");        // ex: "19:00"
  const [duration, setDuration] = useState("2");         // default 2 ore

  //
  // 1) Preluăm informații despre teren din API-ul /api/fields/[id]
  //
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

  //
  // 2) De fiecare dată când se schimbă selectedDate, apelăm /api/reservations?field=<id>&date=<selectedDate>
  //    și populăm `reservations` cu rezervările existente pe acel teren/zi.
  //
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

  //
  // 3) Când dai click pe un slot liber din Timetable, apelăm onSlotClick și setăm `startTime`
  //
  const handleSlotClick = (hour) => {
    const hourString = String(hour).padStart(2, "0");
    setStartTime(`${hourString}:00`);
  };

  //
  // 4) La submit-ul formularului de rezervare, trimitem un POST către /api/reservations
  //    pentru a crea o nouă rezervare cu status="pending". Apoi redirecționăm către pagina de plată.
  //
  const handleReservationSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // 4a) Dacă nu ești autentificat, redirecționează la /login
    if (!session) {
      router.push("/login");
      return;
    }

    // 4b) Validări simple
    if (!selectedDate) {
      setMessage("Te rog selectează data.");
      return;
    }
    if (!startTime) {
      setMessage("Te rog alege un slot orar liber.");
      return;
    }

    // 4c) Construim payload-ul
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
        // 4d) Rezervarea s-a creat cu status = "pending". Preluăm _id-ul și redirecționăm
        const newResId = data.reservation._id;
        router.push(`/payment?reservationId=${newResId}`);
      } else {
        // 4e) A apărut o eroare (server-side)
        setMessage(data.error || "Rezervare eșuată.");
      }
    } catch (error) {
      console.error("Eroare la rezervare:", error);
      setMessage("Eroare de server.");
    }
  };

  // Dacă încă se încarcă datele terenului
  if (loadingField) {
    return <p className="p-4 text-white">Se încarcă datele terenului...</p>;
  }
  // Dacă nu s-a găsit terenul
  if (!field) {
    return <p className="p-4 text-white">Terenul nu a fost găsit.</p>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Buton „Înapoi” */}
      <button
        onClick={() => router.back()}
        className="mb-4 bg-blue-600 px-3 py-1 rounded hover:bg-blue-700"
      >
        Înapoi
      </button>

      <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded shadow">
        {/* Imagine teren (dacă există) */}
        {field.images && field.images.length > 0 && (
          <img
            src={field.images[0]}
            alt={field.name}
            className="w-full h-64 object-cover rounded mb-4"
          />
        )}

        {/* Nume, preț, adresă */}
        <h1 className="text-3xl font-bold mb-2">{field.name}</h1>
        <p className="mb-2">
          <strong>Preț:</strong> {field.pricePerHour} lei/oră
        </p>
        <p className="mb-4">
          <strong>Adresă:</strong> {field.location}
        </p>

        {/* Select data */}
        <div className="mb-6">
          <label className="block font-semibold mb-1">Alege data:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setStartTime(""); // resetăm ora dacă se schimbă data
            }}
            className="p-2 text-black rounded"
          />
        </div>

        {/* Timetable (apare doar dacă selectedDate nu e gol) */}
        {selectedDate && (
          <>
            <h2 className="text-2xl font-semibold mt-2 mb-4">
              Orarul Terenului pentru {selectedDate}
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

        {/* Formular rezervare */}
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
