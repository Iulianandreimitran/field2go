//src/app/admin/edit-field/[id]/page.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditFieldPage() {
  const router = useRouter();
  const { id } = useParams();

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [sportType, setSportType] = useState("");
  const [pricePerHour, setPricePerHour] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!id) return;

    const fetchField = async () => {
      try {
        const res = await fetch(`/api/fields/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.msg);
        const f = data.field;
        setName(f.name);
        setLocation(f.location);
        setSportType(f.sportType);
        setPricePerHour(f.pricePerHour);
        setDescription(f.description || "");
      } catch (err) {
        setMessage("Eroare la încărcarea terenului.");
      }
    };

    fetchField();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await fetch(`/api/fields/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          location,
          sportType,
          pricePerHour: Number(pricePerHour),
          description,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg);
      router.push("/admin/dashboard");
    } catch (err) {
      setMessage("Eroare la actualizare: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-8 text-center">✏️ Editează Teren</h1>

      {message && <p className="mb-6 text-red-400 font-medium">{message}</p>}

      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-md px-6 py-8 space-y-5"
      >
        <div>
          <label className="block mb-1 text-sm text-gray-300">Nume Teren</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Ex: Teren Central"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm text-gray-300">Locație</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm text-gray-300">Tip Sport</label>
          <input
            type="text"
            value={sportType}
            onChange={(e) => setSportType(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm text-gray-300">Preț pe oră</label>
          <input
            type="number"
            value={pricePerHour}
            onChange={(e) => setPricePerHour(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm text-gray-300">Descriere</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Descriere opțională a terenului"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:brightness-110 text-black font-semibold py-2 rounded-lg transition"
        >
          💾 Salvează Modificările
        </button>
      </form>
    </div>
  );

}
