// src/components/SearchBar.jsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import useDebounce from "@/hooks/useDebounce";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedQuery = useDebounce(query, 500);
  const router = useRouter();
  const inputRef = useRef(null);

  useEffect(() => {
    if (!debouncedQuery) {
      setSuggestions([]);
      return;
    }
    async function fetchSuggestions() {
      try {
        const res = await fetch(
          `/api/users/search?query=${encodeURIComponent(debouncedQuery)}`
        );
        if (!res.ok) throw new Error("Network response was not ok");
        const data = await res.json();
        setSuggestions(data.slice(0, 3));
        setShowDropdown(true);
      } catch (error) {
        console.error("Eroare la fetch sugestii:", error);
      }
    }
    fetchSuggestions();
  }, [debouncedQuery]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={inputRef} className="relative w-80">
      <input
        type="text"
        className="w-full px-3 py-1 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Caută utilizatori..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setShowDropdown(true);
        }}
      />
      {showDropdown && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full bg-gray-800 text-white rounded-md mt-1 shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((user) => (
            <li
              key={user.id}
              className="px-3 py-2 hover:bg-gray-700 cursor-pointer"
              onClick={() => {
                setShowDropdown(false);
                setQuery("");
                // Navigăm la /users/[username], nu la /users/[id]
                router.push(`/users/${user.name}`);
              }}
            >
              {user.name} ({user.email})
            </li>
          ))}
          <li
            className="px-3 py-2 hover:bg-gray-700 cursor-pointer font-semibold"
            onClick={() => {
              setShowDropdown(false);
              router.push(`/users/search?query=${encodeURIComponent(query)}`);
            }}
          >
            Vezi toate rezultatele
          </li>
        </ul>
      )}
    </div>
  );
}
