"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [editable, setEditable] = useState(false);
  const [message, setMessage] = useState("");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push("/login");
      return;
    }

    loadUserData();
  }, [session, status]);

  const loadUserData = async () => {
    try {
      const res = await fetch(`/api/users/${session.user.id}`);
      const data = await res.json();

      if (res.ok) {
        setUsername(data.username);
        setEmail(data.email);
        setBio(data.bio || "");
        setAvatar(data.avatar || "");
        setAvatarPreview(data.avatar || "");
      }
    } catch (err) {
      console.error("Eroare la încărcarea datelor:", err);
    } finally {
      setLoading(false);
    }
  };

  function onAvatarChange(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  }

  async function updateProfile(e) {
    e.preventDefault();
    setMessage("");

    if (newPassword) {
      if (!currentPassword) return setMessage("Parola actuală este necesară.");
      if (newPassword !== confirmPassword) return setMessage("Parolele noi nu se potrivesc.");
      if (newPassword.length < 6) return setMessage("Parola nouă trebuie să aibă cel puțin 6 caractere.");
    }

    const formData = new FormData();
    formData.append("username", username);
    formData.append("email", email);
    formData.append("bio", bio);
    if (avatarFile) formData.append("avatar", avatarFile);
    if (newPassword) {
      formData.append("currentPassword", currentPassword);
      formData.append("newPassword", newPassword);
    }

    const res = await fetch(`/api/users/${session.user.id}/update`, {
      method: "PATCH",
      body: formData,
      credentials: "include",
    });
    const data = await res.json();

    if (res.ok) {
      setMessage("Profil actualizat cu succes!");
      setEditable(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      window.dispatchEvent(new CustomEvent("username-updated", {
        detail: { newName: username }
      }));

      loadUserData();
    } else {
      setMessage(data.msg || data.error || "Eroare la actualizarea profilului.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Se încarcă...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-16 px-4">
      
      <h1 className="text-3xl font-bold mb-8">Profilul meu</h1>

      <div className={`w-full max-w-sm bg-gray-800 rounded-2xl shadow-xl p-6 flex flex-col items-center justify-start ${editable ? "min-h-[500px]" : "min-h-[350px]"}`}>

        {avatarPreview ? (
          <Image
            src={avatarPreview}
            alt="Avatar"
            width={100}
            height={100}
            className="rounded-full mb-4 object-cover border-4 border-purple-500"
          />
        ) : (
          <div className="w-24 h-24 bg-gray-700 rounded-full mb-4" />
        )}

        {!editable ? (
          <>
            <h1 className="text-2xl font-bold mb-4">{username}</h1>

            <p className="mb-2">
              <span className="font-semibold">Email:</span> {email}
            </p>
            <p className="mb-4 text-center">
              <span className="font-semibold">Bio:</span> {bio || "–"}
            </p>

            <button
              onClick={() => setEditable(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded hover:brightness-110"
            >
              Editează profil
            </button>
          </>
        ) : (
          <form onSubmit={updateProfile} className="w-full mt-4 space-y-6">
            {message && <p className="text-green-400 font-medium">{message}</p>}

            <label className="flex flex-col items-center cursor-pointer">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold px-4 py-2 rounded hover:brightness-110 transition">
                {avatarPreview ? "Schimbă avatar" : "Încarcă avatar"}
              </div>
              <input type="file" accept="image/*" onChange={onAvatarChange} className="hidden" />
              {avatarPreview && (
                <img src={avatarPreview} alt="Avatar preview" className="h-24 w-24 rounded-full mt-3 object-cover shadow" />
              )}
            </label>

            <div>
              <label className="block mb-1 font-medium">Nume</label>
              <input
                type="text"
                className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Email</label>
              <input
                type="email"
                className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Bio (scurtă)</label>
              <textarea
                className="w-full bg-gray-700 text-white px-4 py-2 rounded"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            {[{ label: "Parola actuală", value: currentPassword, setter: setCurrentPassword, visible: showCurrent, toggle: () => setShowCurrent(!showCurrent) },
              { label: "Parolă nouă", value: newPassword, setter: setNewPassword, visible: showNew, toggle: () => setShowNew(!showNew) },
              { label: "Confirmă parola nouă", value: confirmPassword, setter: setConfirmPassword, visible: showConfirm, toggle: () => setShowConfirm(!showConfirm) }
            ].map((field, i) => (
              <div key={i} className="relative">
                <label className="block mb-1 font-medium">{field.label}</label>
                <input
                  type={field.visible ? "text" : "password"}
                  value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                  className="w-full bg-gray-700 text-white px-4 py-2 rounded pr-10"
                />
                <button type="button" onClick={field.toggle} className="absolute top-9 right-3 text-gray-300 text-sm">
                  {field.visible ? "🙈" : "👁️"}
                </button>
              </div>
            ))}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setEditable(false)}
                className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700"
              >
                Renunță
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-700 text-white rounded hover:brightness-110"
              >
                Salvează
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

}
