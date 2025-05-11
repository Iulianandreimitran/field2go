// src/components/Header.jsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import NotificationBell from '@/components/NotificationBell';

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();

  // Starea pentru utilizatorul logat manual (nume din localStorage)
  const [localUsername, setLocalUsername] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // La montare, preluăm username-ul din localStorage (dacă există)
    setLocalUsername(localStorage.getItem("username") || "");

    // Ascultăm evenimentul "profileUpdate"
    const handleProfileUpdate = (e) => {
      const newUsername = e.detail?.username;
      if (newUsername) {
        setLocalUsername(newUsername);
      } else {
        const storedUsername = localStorage.getItem("username");
        setLocalUsername(storedUsername || "");
      }
    };

    window.addEventListener("profileUpdate", handleProfileUpdate);
    return () => {
      window.removeEventListener("profileUpdate", handleProfileUpdate);
    };
  }, []);

  // Numele de afișat în header
  const displayName = session
    ? localUsername || session.user.name || session.user.email
    : localUsername || "Log in";

  // Navighează spre pagina /fields
  function handleFieldsClick() {
    router.push("/fields");
  }

  // Navighează spre pagina rezervări publice
  function handleExploreClick() {
    router.push("/explore");
  }

  // Deschide/închide meniul
  function handleHeaderClick() {
    if (!session && !localUsername) {
      router.push("/login");
    } else {
      setMenuOpen((prev) => !prev);
    }
  }

  function handleProfileClick() {
    router.push("/profile");
    setMenuOpen(false);
  }

  function handleMyReservations() {
    router.push("/my-reservations");
    setMenuOpen(false);
  }

  function handleLogOut() {
    if (session) {
      // Logout pentru sesiunea NextAuth
      signOut({ callbackUrl: "/" });
      // Ștergem datele locale
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("email");
      localStorage.removeItem("role");
    } else {
      // Logout pentru login tradițional
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("email");
      localStorage.removeItem("role");
      window.location.reload();
    }
  }

  return (
    <header className="bg-gray-900 text-white py-2 px-4 flex items-center justify-between relative">
      {/* Butoane stânga */}
      <div className="flex items-center space-x-2">
        <button
          onClick={handleFieldsClick}
          className="bg-pink-600 text-white px-3 py-1 rounded hover:bg-pink-700"
        >
          Vezi Terenuri
        </button>
        <button
          onClick={handleExploreClick}
          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
        >
          Rezervări Publice
        </button>
      </div>

      {/* Containerul pentru “Salut, [nume]” + clopoțel + dropdown */}
      <div className="relative flex items-center">
        <div onClick={handleHeaderClick} className="cursor-pointer flex items-center">
          <span>{`Salut, ${displayName}`}</span>
        </div>

        {/* Notification Bell */}
        {session || localUsername ? <NotificationBell /> : null}

        {menuOpen && (
          <div className="absolute top-full right-0 mt-2 bg-gray-800 rounded shadow-md text-white w-48">
            <ul className="py-2">
              <li
                className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
                onClick={handleProfileClick}
              >
                Profil
              </li>
              <li
                className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
                onClick={handleMyReservations}
              >
                Rezervările Mele
              </li>
              <li
                className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
                onClick={handleLogOut}
              >
                Logout
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}
