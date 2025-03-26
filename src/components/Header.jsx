"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Header() {
  // Pentru autentificarea completă cu NextAuth (Google)
  const { data: session } = useSession();
  const router = useRouter();

  // Pentru login-ul tradițional (stocat în localStorage)
  const [localUsername, setLocalUsername] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    // Funcție care preia username-ul actualizat din localStorage
    const updateUsername = () => {
      const storedUsername = localStorage.getItem("username");
      setLocalUsername(storedUsername || "");
    };
  
    // La montarea componentei, adaugă listener-ul
    window.addEventListener("usernameUpdate", updateUsername);
  
    // Șterge listenerul la demontarea componentei
    return () => {
      window.removeEventListener("usernameUpdate", updateUsername);
    };
  }, []);
  

  // Dacă există sesiune din NextAuth, folosește datele din ea;
  // altfel, folosește username-ul din localStorage
  const displayName = session
    ? session.user.name || session.user.email
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
      signOut({ callbackUrl: "/" });
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      window.location.reload();
    }
  }

  return (
    <header className="bg-gray-900 text-white py-2 px-4 flex justify-end relative">
      <div onClick={handleHeaderClick} className="cursor-pointer">
        <span>{`Salut, ${displayName}`}</span>
      </div>

      {menuOpen && (
        <div className="absolute right-0 mt-2 bg-gray-800 rounded shadow-md text-white w-40">
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