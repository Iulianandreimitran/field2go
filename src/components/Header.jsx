// src/components/Header.jsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import NotificationBell from "@/components/NotificationBell";
import SearchBar from "@/components/SearchBar";

export default function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Dacă utilizatorul s-a logat manual sau prin NextAuth
  const [localUsername, setLocalUsername] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setLocalUsername(localStorage.getItem("username") || "");

    const handleProfileUpdate = (e) => {
      const newUsername = e.detail?.username;
      if (newUsername) {
        setLocalUsername(newUsername);
      } else {
        setLocalUsername(localStorage.getItem("username") || "");
      }
    };
    window.addEventListener("profileUpdate", handleProfileUpdate);
    return () => {
      window.removeEventListener("profileUpdate", handleProfileUpdate);
    };
  }, []);

  const displayName = session
    ? session.user.name || session.user.email || localUsername
    : localUsername || "Log in";

  function handleFieldsClick() {
    router.push("/fields");
  }

  function handleExploreClick() {
    router.push("/explore");
  }

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

  function handleFriends() {
    router.push("/friends");
    setMenuOpen(false);
  }

  function handleLogOut() {
    if (session) {
      signOut({ callbackUrl: "/" });
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("email");
      localStorage.removeItem("role");
    } else {
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

      {/* Dacă utilizatorul e autentificat, afișăm SearchBar */}
      <div className="flex-1 mx-4">
        {status === "authenticated" && <SearchBar />}
      </div>

      {/* Salut și clopoțel */}
      <div className="relative flex items-center space-x-4">
        <div onClick={handleHeaderClick} className="cursor-pointer">
          <span>{`Salut, ${displayName}`}</span>
        </div>
        {(status === "authenticated" || localUsername) && <NotificationBell />}

        {menuOpen && (
          <div className="absolute top-full right-0 mt-2 bg-gray-800 rounded shadow-md text-white w-48 z-20">
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
                onClick={handleFriends}  /* Iată secțiunea „Prieteni” */
              >
                Prieteni
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
