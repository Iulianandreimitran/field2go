// src/app/payment-success/page.jsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");
  const fieldId   = searchParams.get("fieldId"); 
    // (dacă vrei să redirecționezi la pagina terenului după confirmare)

  const [message, setMessage] = useState("Verificăm plata...");

  useEffect(() => {
    if (!sessionId) {
      setMessage("Lipsă session_id.");
      return;
    }

    const verifyPayment = async () => {
      try {
        const res = await fetch("/api/stripe/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json();

        if (res.ok && data.reservationId) {
          setMessage("Plata a fost efectuată cu succes!");
          // După 2s‐3s, redirecționează direct la „My Reservations”
          setTimeout(() => {
            router.push("/my-reservations");
          }, 2000);
        } else {
          // Dacă serverul a răspuns cu eroare
          setMessage(data.error || "Eroare la verificarea plății.");
        }
      } catch (err) {
        console.error("Eroare la verificarea plății:", err);
        setMessage("Eroare de server la verificarea plății.");
      }
    };

    verifyPayment();
  }, [sessionId, router]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <p>{message}</p>
    </div>
  );
}
