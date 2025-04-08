// src/app/payment-success/page.jsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");
  const fieldId = searchParams.get("fieldId");

  const [message, setMessage] = useState("Verificăm plata...");

  useEffect(() => {
    if (!sessionId) {
      setMessage("Lipsă session_id.");
      return;
    }
    // Verificăm plata
    const verifyPayment = async () => {
      try {
        const res = await fetch("/api/stripe/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();
        if (res.ok) {
          setMessage("Plata a fost efectuată cu succes!");
          // Aici, fie redirecționezi direct la /fields/[fieldId]/reserve,
          // fie aștepți câteva secunde
          setTimeout(() => {
            if (fieldId) {
              router.push(`/fields/${fieldId}/reserve`);
            } else {
              router.push("/fields"); // fallback
            }
          }, 3000);
        } else {
          setMessage(data.msg || "Eroare la verificarea plății.");
        }
      } catch (err) {
        console.error("Eroare la verificarea plății:", err);
        setMessage("Eroare de server la verificarea plății.");
      }
    };
    verifyPayment();
  }, [sessionId, fieldId, router]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <p>{message}</p>
    </div>
  );
}
