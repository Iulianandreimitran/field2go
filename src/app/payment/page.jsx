// src/app/payment/page.jsx
"use client";

import { useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const reservationId = searchParams.get("reservationId");
  const amount = searchParams.get("amount"); // de exemplu, 24000
  const [message, setMessage] = useState("Inițializare plată...");

  useEffect(() => {
    if (!reservationId || !amount) {
      setMessage("Date insuficiente pentru plată.");
      return;
    }

    const createCheckoutSession = async () => {
      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reservationId, amount }),
        });
        const data = await res.json();

        if (res.ok && data.sessionId) {
          const stripe = await stripePromise;
          const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
          if (error) {
            setMessage(error.message);
          }
        } else {
          setMessage(data.msg || "Eroare la inițializarea plății.");
        }
      } catch (error) {
        console.error("Eroare la crearea sesiunii Stripe:", error);
        setMessage("Eroare de server la crearea sesiunii de plată.");
      }
    };

    createCheckoutSession();
  }, [reservationId, amount]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <p>{message}</p>
    </div>
  );
}
