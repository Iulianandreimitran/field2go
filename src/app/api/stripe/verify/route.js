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
    
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not confirmed" }, { status: 400 });
    }

    const meta = session.metadata || {};
    const reservationId = meta.reservationId;
    if (!reservationId) {
      return NextResponse.json({ error: "Missing reservationId in metadata" }, { status: 400 });
    }

    const existing = await Reservation.findById(reservationId);
    if (!existing) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    existing.status = "active";
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
