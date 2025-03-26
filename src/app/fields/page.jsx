//src/app/fields/page.jsx
"use client";
import { useEffect, useState } from "react";

export default function FieldsPage() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  // Functia pentru preluarea datelor din API-ul de terenuri
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

  if (loading) return <p>Loading fields...</p>;

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center">Terenuri Sportive</h1>
      {fields.length === 0 ? (
        <p>Nu au fost găsite terenuri.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {fields.map((field) => (
            <div
              key={field._id}
              className="bg-white shadow-md rounded-lg overflow-hidden p-4 flex flex-col"
            >
              {/* Dacă există imagini, se afișează prima imagine */}
              {field.images && field.images.length > 0 && (
                <img
                  src={field.images[0]}
                  alt={field.name}
                  className="w-full h-40 object-cover rounded mb-4"
                />
              )}
              <h2 className="text-xl font-semibold mb-2">{field.name}</h2>
              <p className="text-gray-600 mb-1">
                <strong>Adresă:</strong> {field.location}
              </p>
              <p className="text-gray-800 mb-2">
                <strong>Preț:</strong> {field.pricePerHour} lei/oră
              </p>
              {/* Opțional, poți afișa și o descriere */}
              {field.description && (
                <p className="text-sm text-gray-700">{field.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}