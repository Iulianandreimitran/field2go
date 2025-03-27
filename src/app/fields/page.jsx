// src/app/fields/page.jsx
"use client";
import { useEffect, useState } from "react";

export default function FieldsPage() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  // Funcția pentru preluarea datelor din API-ul de terenuri
  const fetchFields = async () => {
    try {
      const res = await fetch("/api/fields");
      const data = await res.json();
      setFields(data.fields);
    } catch (err) {
      console.error("Eroare la preluarea terenurilor:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, []);

  if (loading) {
    return (
      <div className="p-4 bg-gray-900 min-h-screen">
        <h1 className="text-3xl font-bold mb-6 text-center text-white">
          Terenuri Sportive
        </h1>
        <p className="text-white">Loading fields...</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center text-white">
        Terenuri Sportive
      </h1>
      {fields.length === 0 ? (
        <p className="text-white">Nu au fost găsite terenuri.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {fields.map((field) => (
            <div
              key={field._id}
              className="bg-pink-200 text-blue-900 shadow-md rounded-lg overflow-hidden p-4 flex flex-col"
            >
              {/* Dacă există imagini, afișăm prima imagine */}
              {field.images && field.images.length > 0 && (
                <img
                  src={field.images[0]}
                  alt={field.name}
                  className="w-full h-40 object-cover rounded mb-4"
                />
              )}
              <h2 className="text-xl font-semibold mb-2">{field.name}</h2>
              <p className="mb-1">
                <strong>Adresă:</strong> {field.location}
              </p>
              <p className="mb-1">
                <strong>Preț:</strong> {field.pricePerHour} lei/oră
              </p>
              <p className="mb-1">
                <strong>Sport:</strong> {field.sportType}
              </p>
              {field.description && (
                <p className="text-sm mb-2">{field.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
