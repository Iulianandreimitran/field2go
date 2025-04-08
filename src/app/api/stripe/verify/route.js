// src/app/api/stripe/verify/route.js
import { NextResponse } from "next/server";
import Stripe from "stripe";
import dbConnect from "../../../../utils/dbConnect";
import Reservation from "../../../../models/Reservation";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

export async function POST(request) {
  try {
    await dbConnect();
    const { sessionId } = await request.json();
    if (!sessionId) {
      return NextResponse.json({ msg: "sessionId is required" }, { status: 400 });
    }

    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (stripeSession.payment_status === "paid") {
      // extragem reservationId și fieldId din metadata
      const reservationId = stripeSession.metadata.reservationId;
      // optional: const fieldId = stripeSession.metadata.fieldId;

      const updatedReservation = await Reservation.findByIdAndUpdate(
        reservationId,
        { status: "paid", expiresAt: null },
        { new: true }
      );

      return NextResponse.json({
        msg: "Payment confirmed and reservation updated",
        reservation: updatedReservation,
      }, { status: 200 });
    } else {
      return NextResponse.json({
        msg: "Payment not completed",
        payment_status: stripeSession.payment_status,
      }, { status: 400 });
    }
  } catch (error) {
    console.error("Error verifying Stripe session:", error);
    return NextResponse.json(
      { msg: "Error verifying payment session", error: error.message },
      { status: 500 }
    );
  }
}
