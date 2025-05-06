"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();

  // fallback pentru autentificare tradițională
  const [localProfile, setLocalProfile] = useState({
    username: "",
    email: "",
    avatar: "",
    bio: ""
  });
  const [loading, setLoading] = useState(true);

  // valorile afișate
  const [displayName, setDisplayName] = useState("");
  const [displayEmail, setDisplayEmail] = useState("");
  const [displayAvatar, setDisplayAvatar] = useState("");
  const [displayBio, setDisplayBio] = useState("");

  // modul edit + câmpuri
  const [editable, setEditable] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newAvatar, setNewAvatar] = useState("");
  const [newBio, setNewBio] = useState("");

  // parole
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // toggles show/hide
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [message, setMessage] = useState("");

  // încărcare inițială din storage
  useEffect(() => {
    const u = localStorage.getItem("username") || "";
    const e = localStorage.getItem("email") || "";
    let a = "";
    let b = "";
    if (e) {
      const storedAvatar = localStorage.getItem(`avatar_${e}`);
      const storedBio = localStorage.getItem(`bio_${e}`);
      a = storedAvatar !== null ? storedAvatar : (localStorage.getItem("avatar") || "");
      b = storedBio !== null ? storedBio : (localStorage.getItem("bio") || "");
    } else {
      a = localStorage.getItem("avatar") || "";
      b = localStorage.getItem("bio") || "";
    }
    setLocalProfile({ username: u, email: e, avatar: a, bio: b });
    setLoading(false);
  }, []);

  // inițializează câmpurile de edit
  useEffect(() => {
    if (!loading) {
      if (session) {
        setNewUsername(session.user.name || session.user.email);
        setNewEmail(session.user.email);
        setNewAvatar(session.user.image || "");
        setNewBio(session.user.bio || "");
      } else {
        setNewUsername(localProfile.username);
        setNewEmail(localProfile.email);
        setNewAvatar(localProfile.avatar);
        setNewBio(localProfile.bio);
      }
    }
  }, [loading, session, localProfile]);

  // actualizează afișarea
  useEffect(() => {
    if (!loading) {
      if (session) {
        setDisplayName(session.user.name || session.user.email);
        setDisplayEmail(session.user.email);
        setDisplayAvatar(session.user.image || "");
        setDisplayBio(session.user.bio || "");
      } else {
        setDisplayName(localProfile.username);
        setDisplayEmail(localProfile.email);
        setDisplayAvatar(localProfile.avatar);
        setDisplayBio(localProfile.bio);
      }
    }
  }, [loading, session, localProfile]);

  // redirect dacă nu e logat
  useEffect(() => {
    if (!loading && !session && !localProfile.username) {
      router.push("/login");
    }
  }, [loading, session, localProfile.username, router]);

  async function updateProfile(e) {
    e.preventDefault();
    setMessage("");

    // validare parole
    if (newPassword) {
      if (!currentPassword) {
        setMessage("Introdu parola actuală pentru a schimba parola.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setMessage("Parolele noi nu se potrivesc.");
        return;
      }
      if (newPassword.length < 6) {
        setMessage("Parola nouă trebuie să aibă cel puțin 6 caractere.");
        return;
      }
    }

    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const body = {
      username: newUsername,
      email: newEmail,
      avatar: newAvatar,
      bio: newBio,
    };
    if (newPassword) {
      body.currentPassword = currentPassword;
      body.newPassword = newPassword;
    }

    const res = await fetch("/profile/update", {
      method: "PATCH",
      headers,
      credentials: "include",
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (res.ok) {
      setMessage("Profil actualizat cu succes!");
      // salvează în localStorage (fallback)
      if (token) {
        localStorage.setItem("username", data.username);
        localStorage.setItem("email", data.email);
        localStorage.setItem(`avatar_${data.email}`, data.avatar || "");
        localStorage.setItem(`bio_${data.email}`, data.bio || "");
      }
      // actualizează afișarea
      setDisplayName(data.username);
      setDisplayEmail(data.email);
      setDisplayAvatar(data.avatar || "");
      setDisplayBio(data.bio || "");

      // actualizează session dacă există
      if (session) {
        session.user.name = data.username;
        session.user.email = data.email;
        session.user.image = data.avatar;
        session.user.bio = data.bio;
      }

      // curăță câmpuri
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setEditable(false);
      // eveniment global
      window.dispatchEvent(new CustomEvent("profileUpdate", {
        detail: {
          username: data.username,
          email: data.email,
          avatar: data.avatar,
          bio: data.bio
        }
      }));
    } else {
      setMessage(data.msg || "Eroare la actualizarea profilului");
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center pt-16">
      <h1 className="text-3xl font-bold mb-4">Profilul Meu</h1>
      {message && <p className="mb-4 text-green-400">{message}</p>}

      <div className="bg-gray-800 p-6 rounded shadow-md w-96">
        {editable ? (
          <form onSubmit={updateProfile}>
            {/* Username */}
            <div className="mb-4">
              <label className="block mb-1 font-bold">Nume:</label>
              <input
                className="w-full p-2 rounded text-black"
                type="text"
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
              />
            </div>
            {/* Email */}
            <div className="mb-4">
              <label className="block mb-1 font-bold">Email:</label>
              <input
                className="w-full p-2 rounded text-black"
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
              />
            </div>
            {/* Avatar URL */}
            <div className="mb-4">
              <label className="block mb-1 font-bold">Imagine profil (URL):</label>
              <input
                className="w-full p-2 rounded text-black"
                type="text"
                value={newAvatar}
                onChange={e => setNewAvatar(e.target.value)}
              />
              {newAvatar && (
                <div className="mt-2 flex justify-center">
                  <img
                    src={newAvatar}
                    alt="Avatar preview"
                    className="h-24 w-24 rounded-full"
                  />
                </div>
              )}
            </div>
            {/* Bio */}
            <div className="mb-4">
              <label className="block mb-1 font-bold">Bio (scurtă):</label>
              <textarea
                className="w-full p-2 rounded text-black"
                rows={3}
                value={newBio}
                onChange={e => setNewBio(e.target.value)}
              />
            </div>

            {/* Parola actuală */}
            <div className="mb-4 relative">
              <label className="block mb-1 font-bold">Parola actuală:</label>
              <input
                className="w-full p-2 rounded text-black pr-10"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute top-9 right-3 text-gray-600"
                onClick={() => setShowCurrent(v => !v)}
              >
                {showCurrent ? "🙈" : "👁️"}
              </button>
            </div>

            {/* Parola nouă */}
            <div className="mb-4 relative">
              <label className="block mb-1 font-bold">Parolă nouă:</label>
              <input
                className="w-full p-2 rounded text-black pr-10"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute top-9 right-3 text-gray-600"
                onClick={() => setShowNew(v => !v)}
              >
                {showNew ? "🙈" : "👁️"}
              </button>
            </div>

            {/* Confirmă parola nouă */}
            <div className="mb-4 relative">
              <label className="block mb-1 font-bold">Confirmă parola nouă:</label>
              <input
                className="w-full p-2 rounded text-black pr-10"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute top-9 right-3 text-gray-600"
                onClick={() => setShowConfirm(v => !v)}
              >
                {showConfirm ? "🙈" : "👁️"}
              </button>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
              >
                Salvează
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
                onClick={() => {
                  // reset câmpuri
                  setNewUsername(displayName);
                  setNewEmail(displayEmail);
                  setNewAvatar(displayAvatar);
                  setNewBio(displayBio);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setEditable(false);
                }}
              >
                Renunță
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center">
            {displayAvatar && (
              <div className="flex justify-center mb-4">
                <img
                  src={displayAvatar}
                  alt="Avatar"
                  className="h-24 w-24 rounded-full"
                />
              </div>
            )}
            <p className="mb-2">
              <strong>Nume:</strong> {displayName || "Nespecificat"}
            </p>
            <p className="mb-2">
              <strong>Email:</strong> {displayEmail || "Nespecificat"}
            </p>
            <p className="mb-4">
              <strong>Bio:</strong> {displayBio || "Nespecificat"}
            </p>
            <button
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
              onClick={() => setEditable(true)}
            >
              Editează Profilul
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
