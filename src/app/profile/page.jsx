"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();

  // Stare pentru datele de fallback (autentificare tradițională)
  const [localProfile, setLocalProfile] = useState({ username: "", email: "" });
  const [loading, setLoading] = useState(true);

  // Stări pentru modul edit și câmpurile editabile
  const [editable, setEditable] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [message, setMessage] = useState("");

  // Citește datele salvate în localStorage
  useEffect(() => {
    const storedUsername = localStorage.getItem("username") || "";
    const storedEmail = localStorage.getItem("email") || "";
    setLocalProfile({ username: storedUsername, email: storedEmail });
    setLoading(false);
  }, []);

  // După ce datele au fost încărcate, initializează câmpurile pentru editare
  useEffect(() => {
    if (!loading) {
      setNewUsername(session ? (session.user.name || session.user.email) : localProfile.username);
      setNewEmail(session ? session.user.email : localProfile.email);
    }
  }, [loading, session, localProfile]);

  // Redirect către /login dacă nu există sesiune și nici date locale
  useEffect(() => {
    if (!loading && !session && !localProfile.username) {
      router.push("/login");
    }
  }, [loading, session, localProfile.username, router]);

  // Funcția ce face update profilului prin API-ul creat
  const updateProfile = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("No token found. Please log in again.");
      router.push("/login");
      return;
    }

    const res = await fetch("/profile/update", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
      },
      body: JSON.stringify({ username: newUsername, email: newEmail }),
    });

    const data = await res.json();
    if (res.ok) {
      setMessage("Profile updated successfully!");
      // Actualizează datele locale și în localStorage
      localStorage.setItem("username", data.username);
      localStorage.setItem("email", data.email);
      setLocalProfile({ username: data.username, email: data.email });
      setEditable(false);
    } else {
      setMessage(data.msg || "Error updating profile");
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  // Folosește datele din sesiune sau din localStorage ca valori de afişare
  const name = session ? (session.user.name || session.user.email) : localProfile.username;
  const email = session ? session.user.email : localProfile.email;

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
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded mr-2">
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
              <strong>Nume:</strong> {name || "Unavailable"}
            </p>
            <p className="mb-4">
              <strong>Email:</strong> {email || "Unavailable"}
            </p>
            <button
              onClick={() => setEditable(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
            >
              Edit Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}