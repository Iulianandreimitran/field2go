// components/ChatbotButton.jsx
"use client";

export default function ChatbotButton({ onToggle, isOpen }) {
  return (
    <button
      onClick={onToggle}
      aria-label="Chat"
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        width: 50,
        height: 50,
        borderRadius: "50%",
        background: "#0078ff",
        color: "white",
        fontSize: 24,
        border: "none",
        cursor: "pointer",
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
        zIndex: 1000,
      }}
    >
      {isOpen ? "×" : "💬"}
    </button>
  );
}
