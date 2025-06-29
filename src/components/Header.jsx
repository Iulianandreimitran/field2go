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
    if (!localUsername) {
      if (session?.user?.name) {
        setLocalUsername(session.user.name);
      } else if (session?.user?.email) {
        setLocalUsername(session.user.email);
      }
    }

    const handleUsernameUpdate = (e) => {
      if (e.detail?.newName) {
        setLocalUsername(e.detail.newName);
      }
    };

    window.addEventListener("username-updated", handleUsernameUpdate);

    return () => {
      window.removeEventListener("username-updated", handleUsernameUpdate);
    };
  }, [session, localUsername]);



  const displayName =
    localUsername || "Log in";

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
    <header className="bg-gray-900 text-white py-3 px-4 flex items-center justify-between relative shadow-md">
      {/* Butoane stânga */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleFieldsClick}
          className="bg-gradient-to-r from-pink-600 to-pink-500 hover:brightness-110 text-white px-4 py-1.5 rounded-lg font-semibold transition"
        >
          Vezi Terenuri
        </button>

        {userRole !== "admin" && (
          <button
            onClick={handleExploreClick}
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:brightness-110 text-white px-4 py-1.5 rounded-lg font-semibold transition"
          >
            Rezervări Publice
          </button>
        )}
      </div>

      {/* SearchBar dacă e autentificat și nu e admin */}
      <div className="flex-1 mx-6">
        {status === "authenticated" && userRole !== "admin" && <SearchBar />}
      </div>

      {/* Salut și meniul dropdown */}
      <div className="relative flex items-center gap-4">
        <div
          onClick={handleHeaderClick}
          className="cursor-pointer hover:underline font-medium"
        >
          {`Salut, ${displayName}`}
        </div>

        {status === "authenticated" && <NotificationBell />}

        {menuOpen && (
          <div className="absolute top-full right-0 mt-2 bg-gray-800 rounded-xl shadow-lg text-white w-52 z-50 overflow-hidden border border-gray-700">
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
