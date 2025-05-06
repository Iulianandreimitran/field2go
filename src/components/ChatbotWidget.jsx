// src/components/ChatbotWidget.jsx
"use client";
import { useState } from "react";
import ChatbotButton from "./ChatbotButton";
import ChatbotWindow from "./ChatbotWindow";

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);

  const toggleChat = () => {
    if (!isOpen && messages.length === 0) {
      // la prima deschidere adaug mesajul de bun venit
      setMessages([{ sender: "bot", text: "Bine ați venit! Cu ce pot să vă ajut?" }]);
    }
    setIsOpen((o) => !o);
  };

  const handleSend = async (userText) => {
    if (!userText.trim()) return;
    // adaug mesajul utilizator
    setMessages((m) => [...m, { sender: "user", text: userText }]);

    // obțin răspunsul bot-ului
    const botReply = await getBotReply(userText);
    setMessages((m) => [...m, botReply]);
  };

  return (
    <>
      {isOpen && <ChatbotWindow messages={messages} onSend={handleSend} />}
      <ChatbotButton onToggle={toggleChat} isOpen={isOpen} />
    </>
  );
}

// logica de interpretare
async function getBotReply(userQuestion) {
  const q = userQuestion.toLowerCase();

  // 1) Estimare cost: „X ore la Y RON/oră”
  const costPattern = /(\d+)\s*ore.*?(\d+)\s*ron\/or\u0103/i;
  const costMatch = q.match(costPattern);
  if (costMatch) {
    const hours = parseInt(costMatch[1], 10);
    const rate = parseInt(costMatch[2], 10);
    const total = hours * rate;
    return {
      sender: "bot",
      text: `${hours} ore la ${rate} RON/oră = ${total} RON. Vrei să mergi direct la sistemul de plată?`,
      action: { label: "Mergi la plată", url: "/payment" },
    };
  }

  // 2) Cum se face rezervarea
  if (q.includes("rezervare")) {
    return {
      sender: "bot",
      text:
        "Pentru a face o rezervare, accesați „Vezi Terenuri”, alegeți terenul și intervalul dorit, apoi confirmați și veți fi direcționat spre plată.",
    };
  }

  // 3) Despre sistemul de plată
  const payPattern = /(plat[ăa]|cost|preț|tarif)/i;
  if (payPattern.test(q)) {
    return {
      sender: "bot",
      text:
        "Plata se face online, imediat după confirmarea rezervării. Poți alege un interval în „Vezi Terenuri” → rezervă → plata online cu cardul, printr-un procesator securizat.",
    };
  }

  // 4) Terenuri libere azi
  if (q.includes("teren") && (q.includes("liber") || q.includes("disponibil"))) {
    try {
      const res = await fetch("/api/fields/available?date=today", { credentials: "include" });
      const available = await res.json();
      if (available.length) {
        const names = available.map((f) => f.name).join(", ");
        return { sender: "bot", text: `Astăzi sunt libere: ${names}.` };
      } else {
        return { sender: "bot", text: "Nu sunt terenuri libere azi. Alege o altă zi." };
      }
    } catch {
      return { sender: "bot", text: "Nu pot obține acum disponibilitatea terenurilor." };
    }
  }

  // 5) Recomandare teren fotbal
  if (q.includes("recomand") && q.includes("fotbal")) {
    try {
      const res = await fetch("/api/fields/recommend?type=fotbal", { credentials: "include" });
      if (!res.ok) throw new Error();
      const field = await res.json();
      return {
        sender: "bot",
        text: `Vă recomandăm terenul ${field.name}, în ${field.location}.`,
      };
    } catch {
      return { sender: "bot", text: "Momentan nu am o recomandare pentru fotbal." };
    }
  }

  // fallback
  return {
    sender: "bot",
    text:
      "Îmi pare rău, nu am înțeles complet. Îți pot oferi informații despre:\n" +
      "- Cum faci rezervări (du-te în „Vezi Terenuri”)\n" +
      "- Plata rezervărilor (tarife, card, securizat)\n" +
      "- Ce terenuri sunt libere azi\n" +
      "- Recomandări de terenuri (fotbal, baschet etc.)\n" +
      "Întreabă-mă orice din aceste domenii!",
  };
}
