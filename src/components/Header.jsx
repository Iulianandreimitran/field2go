// src/components/Header.jsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
      {/* Buton stânga */}
      <button
        onClick={handleFieldsClick}
        className="bg-pink-600 text-white px-3 py-1 rounded hover:bg-pink-700"
      >
        Vezi Terenuri
      </button>

      {/* Containerul pentru “Salut, [nume]” + dropdown */}
      <div className="relative">
        <div onClick={handleHeaderClick} className="cursor-pointer">
          <span>{`Salut, ${displayName}`}</span>
        </div>

        {menuOpen && (
          <div className="absolute top-full right-0 mt-2 bg-gray-800 rounded shadow-md text-white w-40">
            <ul className="py-2">
              <li
                className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
                onClick={handleProfileClick}
              >
                Profile
              </li>
              <li
                className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
                onClick={handleLogOut}
              >
                Log-out
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}
