// src/app/api/stripe/verify/route.js
import { NextResponse } from "next/server";
import Stripe from "stripe";
import dbConnect from "@/utils/dbConnect";
import Reservation from "@/models/Reservation";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    await dbConnect();
    const { sessionId } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    // 1) Preluăm sesiunea de checkout de la Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not confirmed" }, { status: 400 });
    }

    // 2) Extragem metadata din sesiune
    //    Acolo am inclus la checkout: reservationId (ID‐ul făcut anterior ca "pending"),
    //    plus restul informațiilor (userId, fieldId, date, startTime, duration, isPublic)
    const meta = session.metadata || {};
    const reservationId = meta.reservationId;
    if (!reservationId) {
      return NextResponse.json({ error: "Missing reservationId in metadata" }, { status: 400 });
    }

    // 3) Găsim rezervarea inițială (cea cu status = "pending")
    const existing = await Reservation.findById(reservationId);
    if (!existing) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    // 4) Actualizăm rezervarea cu status = "active"
    //    (dacă vrei să lași datele originale, nu e nevoie să le reconstruiești din metadata,
    //     pentru că ele erau deja completate la POST‐ul inițial)
    existing.status = "active";
    // Dacă vrei să marchezi din metadata că e publică după plată:
    // existing.isPublic = meta.isPublic === "1";
    await existing.save();

    return NextResponse.json({
      reservationId: existing._id,
      status: existing.status,
    });
  } catch (err) {
    console.error("Stripe verify error:", err);
    return NextResponse.json(
      { error: "Eroare la verificarea plății." },
      { status: 500 }
    );
  }
}
