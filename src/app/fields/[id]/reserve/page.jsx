// src/app/fields/[id]/reserve/page.jsx
"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Timetable from "@/components/Timetable";

export default function ReserveFieldPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const selectedDateQuery = searchParams.get("selectedDate");

  const [field, setField] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [reservations, setReservations] = useState([]);

  // Stări pentru data, startTime și durată
  const [selectedDate, setSelectedDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState("2");

  // 1) Fetch field
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

  // 2) Fetch reservations from your own API
  useEffect(() => {
    async function fetchReservations() {
      try {
        const res = await fetch(`/api/reservations?fieldId=${id}`);
        const data = await res.json();
        if (res.ok && data.reservations) {
          setReservations(data.reservations);
        }
      } catch (err) {
        console.error("Eroare la preluarea rezervărilor:", err);
      }
    }
    if (id) fetchReservations();
  }, [id]);

  // 3) If there's a selectedDate in the URL, set it
  useEffect(() => {
    if (selectedDateQuery) {
      setSelectedDate(selectedDateQuery);
    }
  }, [selectedDateQuery]);

  // 4) Handle slot click
  const handleSlotClick = (hour) => {
    const hourString = String(hour).padStart(2, "0");
    setStartTime(`${hourString}:00`);
  };

  // 5) Submit reservation
  const handleReservationSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // validare data viitoare
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const chosenDate = new Date(selectedDate);
    if (chosenDate < today) {
      setMessage("Nu poți face rezervări pentru date trecute.");
      return;
    }

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
      setMessage("Te rog selectează o oră de start.");
      return;
    }

    // Calcul timp start/end
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
        // calculam costul in lei
        const totalPriceLei = field.pricePerHour * parseInt(duration, 10);
        const amountInBani = totalPriceLei * 100;
        // redirect la payment
        router.push(`/payment?reservationId=${data.reservation._id}&amount=${amountInBani}`);
      } else {
        setMessage(data.msg || "Rezervare eșuată.");
      }
    } catch (error) {
      console.error("Eroare la rezervare:", error);
      setMessage("Eroare de server");
    }
  };

  if (loading) return <p className="text-white">Se încarcă datele terenului...</p>;
  if (!field) return <p className="text-white">Terenul nu a fost găsit.</p>;

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-4">
      <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded shadow">
        {field.images && field.images.length > 0 && (
          <img
            src={field.images[0]}
            alt={field.name}
            className="w-full h-64 object-cover rounded mb-4"
          />
        )}
        <h1 className="text-3xl font-bold mb-2">{field.name}</h1>
        <p className="mb-1">
          <strong>Preț:</strong> {field.pricePerHour} lei/oră
        </p>
        <p className="mb-4">
          <strong>Adresă:</strong> {field.location}
        </p>

        <div className="mb-6">
          <label className="block font-semibold mb-1 text-white">Alege data:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setStartTime("");
            }}
            // min => previne selecția în calendar a datei trecute
            min={new Date().toISOString().split("T")[0]}
            className="p-2 rounded bg-gray-700 text-white w-full"
          />
        </div>

        {selectedDate && (
          <>
            <label className="block font-semibold mb-1 text-white">
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

        <h2 className="text-2xl font-semibold mt-6 mb-4">Rezervă acest teren</h2>
        {message && (
          <p className="mb-4 text-red-400">
            {message}
          </p>
        )}

        <form onSubmit={handleReservationSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-semibold text-white">Ora de start:</label>
            <input
              type="text"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white"
              placeholder="Ex: 14:00"
              readOnly
            />
            <small className="text-gray-400">
              (Click pe un slot verde din orar pentru a seta ora de start)
            </small>
          </div>

          <div>
            <label className="block mb-1 font-semibold text-white">Durată (ore):</label>
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

          <button
            type="submit"
            className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
          >
            Rezervă
          </button>
        </form>
      </div>
    </div>
  );
}
