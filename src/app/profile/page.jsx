// src/app/profile/page.jsx
"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();

  // Fallback pentru datele profilului (pentru autentificare tradițională)
  const [localProfile, setLocalProfile] = useState({ username: "", email: "" });
  const [loading, setLoading] = useState(true);

  // Stări pentru modul editare și câmpurile editabile
  const [editable, setEditable] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [message, setMessage] = useState("");

  // La montare, încărcăm datele din localStorage (dacă există)
  useEffect(() => {
    const storedUsername = localStorage.getItem("username") || "";
    const storedEmail = localStorage.getItem("email") || "";
    setLocalProfile({ username: storedUsername, email: storedEmail });
    setLoading(false);
  }, []);

  // După ce datele inițiale sunt încărcate, inițializăm câmpurile editabile
  useEffect(() => {
    if (!loading) {
      // Dacă există o sesiune NextAuth activă, folosim datele din aceasta;
      // altfel, folosim datele fallback din localProfile.
      setNewUsername(session ? session.user.name || session.user.email : localProfile.username);
      setNewEmail(session ? session.user.email : localProfile.email);
    }
  }, [loading, session, localProfile]);

  // Ascultă evenimentul "profileUpdate" pentru a sincroniza profilul local dacă a fost schimbat în altă parte (ex: după login)
  useEffect(() => {
    const handleProfileUpdate = (e) => {
      const { username, email } = e.detail;
      setLocalProfile({ username, email });
    };
    window.addEventListener("profileUpdate", handleProfileUpdate);
    return () => {
      window.removeEventListener("profileUpdate", handleProfileUpdate);
    };
  }, []);

  // Dacă utilizatorul nu e logat deloc (nici sesiune, nici token), redirecționăm la /login
  useEffect(() => {
    if (!loading && !session && !localProfile.username) {
      router.push("/login");
    }
  }, [loading, session, localProfile.username, router]);

  // Funcția care trimite cererea de update profil la backend
  const updateProfile = async (e) => {
    e.preventDefault();
    setMessage("");

    // Construim headerul de autorizare în funcție de metoda de autentificare disponibilă
    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Trimitere cerere PATCH cu noile date
    const res = await fetch("/profile/update", {
      method: "PATCH",
      headers,
      credentials: "include", // trimite cookie-urile de sesiune dacă există
      body: JSON.stringify({ username: newUsername, email: newEmail }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage("Profile updated successfully!");
      // Actualizăm localStorage cu noile date
      localStorage.setItem("username", data.username);
      localStorage.setItem("email", data.email);
      // Actualizăm starea locală a profilului cu noile valori
      setLocalProfile({ username: data.username, email: data.email });
      setEditable(false);
      // Emiterea evenimentului pentru a informa și alte componente de modificare
      window.dispatchEvent(
        new CustomEvent("profileUpdate", {
          detail: { username: data.username, email: data.email },
        })
      );
    } else {
      setMessage(data.msg || "Error updating profile");
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  // Determină ce date să afișeze în profil (sesiune sau fallback local)
  const displayName = session ? session.user.name || session.user.email : localProfile.username;
  const displayEmail = session ? session.user.email : localProfile.email;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center pt-16">
      <h1 className="text-3xl font-bold mb-4">Profilul Meu</h1>
      {message && <p className="mb-4 text-green-400">{message}</p>}
      <div className="bg-gray-800 p-6 rounded shadow-md w-96">
        {editable ? (
          <form onSubmit={updateProfile}>
            <div className="mb-4">
              <label className="block mb-1 font-bold">Nume:</label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full p-2 rounded text-black"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-bold">Email:</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full p-2 rounded text-black"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded mr-2"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditable(false)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
            >
              Cancel
            </button>
          </form>
        ) : (
          <div>
            <p className="mb-2">
              <strong>Nume:</strong> {displayName || "Unavailable"}
            </p>
            <p className="mb-4">
              <strong>Email:</strong> {displayEmail || "Unavailable"}
            </p>
            <button
              onClick={() => setEditable(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
            >
              Editează Profilul
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
