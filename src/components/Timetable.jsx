// src/components/Timetable.jsx
"use client";

import { useEffect, useState } from "react";

/**
 * @param {string} fieldId    ID-ul terenului
 * @param {string} date       Data selectată (format "YYYY-MM-DD")
 * @param {number} startHour  Ora de început (de ex. 8)
 * @param {number} endHour    Ora de sfârșit (de ex. 22)
 * @param {(hour: number) => void} onSlotClick  Callback cu ora când se apasă un slot
 */
export default function Timetable({ fieldId, date, startHour = 8, endHour = 22, onSlotClick }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReservations() {
      if (!fieldId || !date) {
        setReservations([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/reservations?field=${fieldId}&date=${date}`, {
          credentials: "include"
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setReservations(data);
        } else {
          setReservations([]);
        }
      } catch (err) {
        console.error("Eroare la încărcarea rezervărilor în Timetable:", err);
        setReservations([]);
      } finally {
        setLoading(false);
      }
    }
    loadReservations();
  }, [fieldId, date]);


  const slots = [];
  for (let hour = startHour; hour < endHour; hour++) {
    slots.push({ start: hour, end: hour + 1 });
  }


  const isSlotReserved = (slot) => {
    if (loading) return false; 

    return reservations.some((res) => {
      const [year, month, day] = res.date.split("-").map((x) => parseInt(x, 10));
      const [rh, rm] = res.startTime.split(":").map((x) => parseInt(x, 10));
      const resStart = new Date(year, month - 1, day, rh, rm, 0);

      const resEnd = new Date(resStart);
      resEnd.setHours(resEnd.getHours() + res.duration);

      const slotStart = new Date(year, month - 1, day, slot.start, 0, 0);
      const slotEnd = new Date(year, month - 1, day, slot.end, 0, 0);

      return resStart < slotEnd && resEnd > slotStart;
    });
  };

  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 mb-4">
      {slots.map((slot, idx) => {
        const reserved = isSlotReserved(slot);
        return (
          <div
            key={idx}
            onClick={() => {
              if (!reserved && onSlotClick) {
                onSlotClick(slot.start);
              }
            }}
            className={`cursor-pointer p-2 text-center rounded 
              ${reserved ? "bg-red-500" : "bg-green-500"} text-white`}
          >
            {`${String(slot.start).padStart(2, "0")}:00 - ${String(slot.end).padStart(
              2,
              "0"
            )}:00`}
          </div>
        );
      })}
    </div>
  );
}
