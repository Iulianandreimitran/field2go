// src/components/Timetable.jsx
// Componentă pentru afișarea orarului; intervalele rezervate (din prop-ul `reservations`) apar cu fundal roșu
import React from "react";

const Timetable = ({
  reservations = [],
  date,              // string "YYYY-MM-DD"
  startHour = 8,
  endHour = 22,
  onSlotClick,
}) => {
  // Construim intervalele orare (startHour până la endHour)
  const slots = [];
  for (let hour = startHour; hour < endHour; hour++) {
    slots.push({ start: hour, end: hour + 1 });
  }

  // Funcție care verifică dacă un anumit slot (oră) este rezervat în ziua selectată
  const isSlotReserved = (slot) => {
    const slotStart = slot.start * 60; // ex. ora 8 -> 480 minute
    const slotEnd = slot.end * 60;
    return reservations.some((res) => {
      // Verificăm dacă rezervarea este pentru data selectată (comparam doar anul-luna-ziua)
      const resDate = new Date(res.startTime);
      const y = resDate.getFullYear();
      const m = String(resDate.getMonth() + 1).padStart(2, "0");
      const d = String(resDate.getDate()).padStart(2, "0");
      const resDateString = `${y}-${m}-${d}`;
      if (resDateString !== date) return false;
      // Calculăm minutele de început și sfârșit ale rezervării
      const resStart = resDate.getHours() * 60 + resDate.getMinutes();
      const resEndDate = new Date(res.endTime);
      const resEnd = resEndDate.getHours() * 60 + resEndDate.getMinutes();
      // Slotul este rezervat dacă intervalul [resStart, resEnd] se suprapune cu intervalul slotului
      return resStart < slotEnd && resEnd > slotStart;
    });
  };

  return (
    <div className="grid grid-cols-12 gap-2">
      {slots.map((slot, index) => {
        const reserved = isSlotReserved(slot);
        return (
          <div
            key={index}
            onClick={() => {
              if (!reserved && onSlotClick) {
                onSlotClick(slot.start); // selectăm ora de start dacă slotul e liber
              }
            }}
            className={`cursor-pointer col-span-1 p-2 text-center rounded ${
              reserved ? "bg-red-500" : "bg-green-500"
            } text-white`}
          >
            {`${slot.start}:00 - ${slot.end}:00`}
          </div>
        );
      })}
    </div>
  );
};

export default Timetable;
