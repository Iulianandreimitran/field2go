// src/app/payment/page.jsx
"use client";

import { useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const reservationId = searchParams.get("reservationId");
  const [message, setMessage] = useState("Inițializare plată...");

  useEffect(() => {
    // Dacă nu avem reservationId în URL, afișăm mesaj de eroare
    if (!reservationId) {
      setMessage("Date insuficiente pentru plată.");
      return;
    }

    const createCheckoutSession = async () => {
      try {
        // Trimitem doar reservationId; backend-ul va calcula suma
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reservationId }),
        });
        const data = await res.json();

        if (res.ok && data.sessionId) {
          const stripe = await stripePromise;
          const { error } = await stripe.redirectToCheckout({
            sessionId: data.sessionId,
          });
          if (error) {
            setMessage(error.message);
          }
        } else {
          setMessage(data.error || "Eroare la inițializarea plății.");
        }
      } catch (error) {
        console.error("Eroare la crearea sesiunii Stripe:", error);
        setMessage("Eroare de server la crearea sesiunii de plată.");
      }
    };

    createCheckoutSession();
  }, [reservationId]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <p>{message}</p>
    </div>
  );
}
