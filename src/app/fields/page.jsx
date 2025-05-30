// src/app/fields/page.jsx
"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function FieldsPage() {
  // Preia sesiunea și status (loading/authenticated/unauthenticated)
  const { data: session, status } = useSession();
  const router = useRouter();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch terenuri la mount
  useEffect(() => {
    async function fetchFields() {
      try {
        const res = await fetch("/api/fields", { credentials: "include" });
        const data = await res.json();
        // API poate returna fie { fields: [...] } fie direct un array
        setFields(data.fields ?? data);
      } catch (err) {
        console.error("Eroare la preluarea terenurilor:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchFields();
  }, []);

  // Determină dacă user-ul este admin din sesiune
  const isAdmin = session?.user?.role === "admin";

  const handleReserve = (fieldId) => {
    router.push(`/fields/${fieldId}/reserve`);
  };

  const handleAddField = () => {
    router.push("/admin/add-field");
  };

  // Afișează loader până la fetch + sesiune gata
  if (status === "loading" || loading) {
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-center text-white">
          Terenuri Sportive
        </h1>
        {isAdmin && (
          <button
            onClick={handleAddField}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Adaugă teren
          </button>
        )}
      </div>
      {fields.length === 0 ? (
        <p className="text-white">Nu au fost găsite terenuri.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {fields.map((field) => (
            <div
              key={field._id}
              className="bg-pink-200 text-blue-900 shadow-md rounded-lg overflow-hidden p-4 flex flex-col"
            >
              {field.images?.length > 0 && (
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
              <button
                onClick={() => handleReserve(field._id)}
                className="mt-auto bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
              >
                Rezervă
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
