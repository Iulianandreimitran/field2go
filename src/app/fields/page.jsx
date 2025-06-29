"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PredictScore from "@/components/PredictScore"; // ✅ nou

export default function FieldsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFields() {
      try {
        const res = await fetch("/api/fields", { credentials: "include" });
        const data = await res.json();
        setFields(data.fields ?? data);
      } catch (err) {
        console.error("Eroare la preluarea terenurilor:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchFields();
  }, []);

  const isAdmin = session?.user?.role === "admin";

  const handleReserve = (fieldId) => {
    router.push(`/fields/${fieldId}/reserve`);
  };

  const handleAddField = () => {
    router.push("/admin/add-field");
  };

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
    <div className="p-6 bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-white">Terenuri Sportive</h1>
        {isAdmin && (
          <button
            onClick={handleAddField}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:brightness-110 text-white px-5 py-2 rounded-lg shadow transition"
          >
            ➕ Adaugă teren
          </button>
        )}
      </div>

      {fields.length === 0 ? (
        <p className="text-white text-lg">Nu au fost găsite terenuri.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {fields.map((field) => (
            <div
              key={field._id}
              className="bg-gray-800 text-white rounded-xl shadow-lg overflow-hidden flex flex-col hover:shadow-xl transition"
            >
              {field.images?.length > 0 && (
                <img
                  src={field.images[0]}
                  alt={field.name}
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="p-4 flex flex-col flex-grow">
                <h2 className="text-xl font-semibold mb-2">{field.name}</h2>
                <p className="text-sm mb-1">
                  <span className="font-semibold">Adresă:</span> {field.location}
                </p>
                <p className="text-sm mb-1">
                  <span className="font-semibold">Preț:</span> {field.pricePerHour} lei/oră
                </p>
                <p className="text-sm mb-1">
                  <span className="font-semibold">Sport:</span> {field.sportType}
                </p>
                {field.description && (
                  <p className="text-sm mb-2 text-gray-300">{field.description}</p>
                )}

                {session?.user?.id && (
                  <div className="text-xs text-indigo-300 mt-1 mb-2">
                    <PredictScore userId={session.user.id} fieldId={field._id} />
                  </div>
                )}

                <button
                  onClick={() => handleReserve(field._id)}
                  className="mt-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:brightness-110 text-white py-2 rounded-lg font-medium transition"
                >
                  Rezervă
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}