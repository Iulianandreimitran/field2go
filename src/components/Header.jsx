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

    // Actualizăm username-ul local dacă primim un eveniment "profileUpdate"
    const handleProfileUpdate = (e) => {
      const newUsername = e.detail?.username;
      if (newUsername) {
        setLocalUsername(newUsername);
      } else {
        // fallback dacă nu avem detalii: citim direct din localStorage
        const storedUsername = localStorage.getItem("username");
        setLocalUsername(storedUsername || "");
      }
    };

    window.addEventListener("profileUpdate", handleProfileUpdate);
    return () => {
      window.removeEventListener("profileUpdate", handleProfileUpdate);
    };
  }, []);

  // Determină numele de afișat în header
  // Dacă există sesiune NextAuth, prioritar afișăm numele din sesiune;
  // dacă nu, sau dacă numele local este disponibil (ex. după update), îl folosim pe cel local.
  const displayName = session
    ? localUsername || session.user.name || session.user.email
    : localUsername || "Log in";

  function handleHeaderClick() {
    if (!session && !localUsername) {
      router.push("/login");
    } else {
      setMenuOpen((prev) => !prev);
    }
  }

  function handleProfileClick() {
    router.push("/profile");
  }

  function handleLogOut() {
    if (session) {
      // Logout pentru sesiunea NextAuth (Google/Credentials)
      signOut({ callbackUrl: "/" });
      // Curățăm și eventualele date locale pentru consistență
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("email");
    } else {
      // Logout pentru autentificarea tradițională
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("email");
      window.location.reload();
    }
  }

  return (
    <header className="bg-gray-900 text-white py-2 px-4 flex justify-end relative">
      <div onClick={handleHeaderClick} className="cursor-pointer">
        <span>{`Salut, ${displayName}`}</span>
      </div>

      {menuOpen && (
        <div className="absolute right-0 mt-8 bg-gray-800 rounded shadow-md text-white w-40">
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
    </header>
  );
}
