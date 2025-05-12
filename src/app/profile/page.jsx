"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [editable, setEditable] = useState(false);
  const [message, setMessage] = useState("");

  // câmpuri de formular
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // fișier avatar + preview
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  // toggles show/hide parole
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // inițializare din sesiune
  useEffect(() => {
    if (session) {
      setUsername(session.user.name || "");
      setEmail(session.user.email || "");
      setBio(session.user.bio || "");
      setAvatarPreview(session.user.image || "");
    } else {
      router.push("/login");
    }
    setLoading(false);
  }, [session, router]);

  // când user alege un fișier, facem preview
  function onAvatarChange(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  }

  // trimite update la profil
  async function updateProfile(e) {
    e.preventDefault();
    setMessage("");

    // validare parole
    if (newPassword) {
      if (!currentPassword) {
        setMessage("Parola actuală este necesară.");
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

    // construim FormData
    const formData = new FormData();
    formData.append("username", username);
    formData.append("email", email);
    formData.append("bio", bio);
    if (avatarFile) formData.append("avatar", avatarFile);
    if (newPassword) {
      formData.append("currentPassword", currentPassword);
      formData.append("newPassword", newPassword);
    }

    const res = await fetch("/profile/update", {
      method: "PATCH",
      credentials: "include",
      body: formData,
    });
    const data = await res.json();

    if (res.ok) {
      setMessage("Profil actualizat cu succes!");
      setEditable(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      // aici poți actualiza contextul/session dacă ai nevoie
    } else {
      setMessage(data.msg || data.error || "Eroare la actualizarea profilului.");
    }
  }

  if (loading) return <p>Loading…</p>;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-16">
      <h1 className="text-3xl font-bold mb-6">Profilul Meu</h1>
      {message && <p className="mb-4 text-green-400">{message}</p>}

      <div className="bg-gray-800 p-8 rounded-xl shadow-md w-full max-w-md">
        {editable ? (
          <form onSubmit={updateProfile} className="space-y-6">
            {/* ==== Upload avatar stilizat ==== */}
            <label className="flex flex-col items-center cursor-pointer mb-4">
              {/* buton vizibil */}
              <div className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded">
                {avatarPreview ? "Schimbă avatar" : "Încarcă avatar"}
              </div>
              {/* input real ascuns */}
              <input
                type="file"
                accept="image/*"
                onChange={onAvatarChange}
                className="hidden"
              />
              {/* preview */}
              {avatarPreview && (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="h-24 w-24 rounded-full mt-2 object-cover"
                />
              )}
            </label>

            {/* Username */}
            <div>
              <label className="block mb-1">Nume:</label>
              <input
                type="text"
                className="w-full rounded px-3 py-2 text-gray-900"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block mb-1">Email:</label>
              <input
                type="email"
                className="w-full rounded px-3 py-2 text-gray-900"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block mb-1">Bio (scurtă):</label>
              <textarea
                className="w-full rounded px-3 py-2 text-gray-900"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            {/* Parola actuală */}
            <div className="relative">
              <label className="block mb-1">Parola actuală:</label>
              <input
                type={showCurrent ? "text" : "password"}
                className="w-full rounded px-3 py-2 text-gray-900 pr-10"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute top-9 right-3 text-gray-600"
              >
                {showCurrent ? "🙈" : "👁️"}
              </button>
            </div>

            {/* Parolă nouă */}
            <div className="relative">
              <label className="block mb-1">Parolă nouă:</label>
              <input
                type={showNew ? "text" : "password"}
                className="w-full rounded px-3 py-2 text-gray-900 pr-10"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute top-9 right-3 text-gray-600"
              >
                {showNew ? "🙈" : "👁️"}
              </button>
            </div>

            {/* Confirmă parola nouă */}
            <div className="relative">
              <label className="block mb-1">Confirmă parola nouă:</label>
              <input
                type={showConfirm ? "text" : "password"}
                className="w-full rounded px-3 py-2 text-gray-900 pr-10"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute top-9 right-3 text-gray-600"
              >
                {showConfirm ? "🙈" : "👁️"}
              </button>
            </div>

            {/* butoane */}
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700"
                onClick={() => setEditable(false)}
              >
                Renunță
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
              >
                Salvează
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center space-y-4">
            {avatarPreview && (
              <img
                src={avatarPreview}
                alt="Avatar"
                className="h-24 w-24 rounded-full mx-auto mb-2 object-cover"
              />
            )}
            <p>
              <strong>Nume:</strong> {username}
            </p>
            <p>
              <strong>Email:</strong> {email}
            </p>
            <p>
              <strong>Bio:</strong> {bio || "–"}
            </p>
            <button
              className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
              onClick={() => setEditable(true)}
            >
              Editează profil
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
