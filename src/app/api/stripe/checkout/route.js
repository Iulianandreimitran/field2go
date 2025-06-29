// src/app/api/stripe/checkout/route.js
import { NextResponse } from "next/server";
import Stripe from "stripe";
import dbConnect from "@/utils/dbConnect";
import Reservation from "@/models/Reservation";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    await dbConnect();
    const { reservationId } = await req.json();

    if (!reservationId) {
      return NextResponse.json({ error: "Missing reservationId" }, { status: 400 });
    }

    const reservation = await Reservation.findById(reservationId).populate("field");
    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }
    const field = reservation.field;
    if (!field) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    const hours = reservation.duration || 1;
    const computedAmount = Math.round(field.pricePerHour * hours * 100);

    if (computedAmount <= 0) {
      return NextResponse.json({ error: "Invalid computed amount" }, { status: 400 });
    }

    const { origin } = new URL(req.url);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "ron",
            product_data: {
              name: `Rezervare ${field.name} pe ${reservation.date}`,
            },
            unit_amount: computedAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&fieldId=${field._id}`,
      cancel_url: `${origin}/fields/${field._id}`,
      metadata: {
        reservationId: reservation._id.toString(),
        userId:        reservation.owner.toString(),
        fieldId:       field._id.toString(),
        date:          reservation.date,        
        startTime:     reservation.startTime,   
        duration:      reservation.duration.toString(),
        isPublic:      reservation.isPublic ? "1" : "0"
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Eroare la crearea sesiunii de checkout" },
      { status: 500 }
    );
  }
}
