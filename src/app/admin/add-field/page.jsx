// src/app/admin/add-field/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddFieldPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [sportType, setSportType] = useState("");
  const [pricePerHour, setPricePerHour] = useState("");
  const [description, setDescription] = useState("");
  const [base64Image, setBase64Image] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [message, setMessage] = useState("");

  // Funcție care se apelează când selectezi un fișier
  async function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFileName(file.name); // reținem numele fișierului

    // Citim fișierul ca Base64
    const reader = new FileReader();
    reader.onload = () => {
      setBase64Image(reader.result); // ex: data:image/png;base64,iVBOR...
    };
    reader.onerror = (error) => {
      console.error("Eroare la citirea fișierului:", error);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
  
    // Citește tokenul din localStorage
    const token = localStorage.getItem("token");
  
    try {
      const res = await fetch("/api/fields", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          location,
          sportType,
          pricePerHour: Number(pricePerHour),
          description,
          base64Image, // trimitem stringul Base64, dacă e setat
        }),
      });
  
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.msg || "Eroare la crearea terenului.");
      } else {
        setMessage("Teren creat cu succes!");
        router.push("/fields");
      }
    } catch (error) {
      console.error("Eroare la conectarea cu serverul:", error);
      setMessage("Eroare de rețea sau server.");
    }
  }
  

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">Adaugă un teren</h1>
      {message && <p className="mb-4 text-red-400">{message}</p>}

      <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded shadow-md w-full max-w-md">
        <div className="mb-4">
          <label className="block mb-1">Nume Teren</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full p-2 rounded bg-gray-700 text-white"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Locație</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            className="w-full p-2 rounded bg-gray-700 text-white"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Tip Sport</label>
          <input
            type="text"
            value={sportType}
            onChange={(e) => setSportType(e.target.value)}
            required
            className="w-full p-2 rounded bg-gray-700 text-white"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Preț pe oră</label>
          <input
            type="number"
            value={pricePerHour}
            onChange={(e) => setPricePerHour(e.target.value)}
            required
            className="w-full p-2 rounded bg-gray-700 text-white"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Descriere (opțional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 text-white"
          />
        </div>

        {/* Input pentru imagine ascuns, + buton stylizat */}
        <div className="mb-4">
          <label className="block mb-1">Imagine (opțional)</label>
          <label
            htmlFor="fileInput"
            className="bg-pink-600 text-white px-3 py-2 rounded cursor-pointer hover:bg-pink-700"
          >
            Alege fișier
          </label>
          <input
            id="fileInput"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />

          {/* Afișăm numele fișierului selectat (dacă există) */}
          {selectedFileName && (
            <p className="mt-2 text-sm text-gray-400">Fișier: {selectedFileName}</p>
          )}

          {/* Opțional, preview imagine */}
          {base64Image && (
            <img
              src={base64Image}
              alt="Preview"
              className="mt-2 w-32 h-32 object-cover rounded"
            />
          )}
        </div>

        <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
          Adaugă Teren
        </button>
      </form>
    </div>
  );
}
