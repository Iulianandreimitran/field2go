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

  const [localUsername, setLocalUsername] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Fallback pentru nume dacă sesiunea nu e încă gata
    setLocalUsername(
      session?.user?.name || session?.user?.email || localStorage.getItem("username") || ""
    );
  }, [session]);

  const displayName =
    session?.user?.name || session?.user?.email || localUsername || "Log in";

  const userRole = session?.user?.role || "user";

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
    signOut({ callbackUrl: "/" });
    localStorage.clear();
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

      {/* SearchBar dacă e autentificat */}
      <div className="flex-1 mx-4">
        {status === "authenticated" && <SearchBar />}
      </div>

      {/* Salut și meniul dropdown */}
      <div className="relative flex items-center space-x-4">
        <div onClick={handleHeaderClick} className="cursor-pointer">
          <span>{`Salut, ${displayName}`}</span>
        </div>
        {status === "authenticated" && <NotificationBell />}

        {menuOpen && (
          <div className="absolute top-full right-0 mt-2 bg-gray-800 rounded shadow-md text-white w-48 z-20">
            <ul className="py-2">
              {userRole !== "admin" && (
                <li
                  className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
                  onClick={handleProfileClick}
                >
                  Profil
                </li>
              )}
              {userRole === "admin" ? (
                <li
                  className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
                  onClick={() => {
                    router.push("/admin/dashboard");
                    setMenuOpen(false);
                  }}
                >
                  Dashboard
                </li>
              ) : (
                <>
                  <li
                    className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
                    onClick={handleMyReservations}
                  >
                    Rezervările Mele
                  </li>
                  <li
                    className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
                    onClick={handleFriends}
                  >
                    Prieteni
                  </li>
                </>
              )}

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

