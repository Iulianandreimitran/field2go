// src/components/ChatbotWindow.jsx
"use client";
import { useState, useEffect, useRef } from "react";

export default function ChatbotWindow({ messages, onSend }) {
  const [input, setInput] = useState("");
  const scrollRef = useRef();

  // Scroll la ultimul mesaj
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  };

  return (
    <div className="fixed bottom-20 right-6 w-80 bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-2 flex justify-between items-center">
        <span className="font-semibold">Chat</span>
        {/* buton de inchidere poate fi aici dacă vrei */}
      </div>

      {/* Mesaje */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.sender === "bot" ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`max-w-[70%] px-3 py-1.5 rounded-lg ${
                m.sender === "bot"
                  ? "bg-gray-100 text-black"
                  : "bg-blue-500 text-white"
              }`}
            >
              {m.text}
              {m.action && m.sender === "bot" && (
                <button
                  onClick={() => (window.location.href = m.action.url)}
                  className="mt-2 w-full text-center bg-green-600 hover:bg-green-700 text-white py-1 rounded"
                >
                  {m.action.label}
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center border-t border-gray-200 bg-white p-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Scrie un mesaj..."
          className="flex-1 px-3 py-2 bg-white text-black placeholder-gray-500 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <button
          type="submit"
          className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:ring-2 focus:ring-blue-300"
        >
          Trimite
        </button>
      </form>
    </div>
  );
}
