import { NextResponse } from "next/server";
import Stripe from "stripe";
import dbConnect from "../../../../utils/dbConnect";
import Reservation from "../../../../models/Reservation";
import Field from "../../../../models/Field";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

export async function POST(request) {
  try {
    await dbConnect();
    const { reservationId, amount } = await request.json();
    if (!reservationId || !amount) {
      return NextResponse.json(
        { msg: "Date insuficiente pentru plată." },
        { status: 400 }
      );
    }

    // Verifică rezervarea înainte de creare sesiune Stripe
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return NextResponse.json(
        { msg: "Rezervarea nu a fost găsită" },
        { status: 404 }
      );
    }
    if (reservation.status !== "pending") {
      return NextResponse.json(
        { msg: "Rezervarea nu mai este disponibilă pentru plată." },
        { status: 400 }
      );
    }
    if (reservation.expiresAt && reservation.expiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        { msg: "Rezervarea a expirat." },
        { status: 400 }
      );
    }

    // Obține terenul pentru a calcula prețul corect
    const field = await Field.findById(reservation.field);
    if (!field) {
      return NextResponse.json(
        { msg: "Terenul asociat rezervării nu a fost găsit" },
        { status: 404 }
      );
    }
    // Calculează suma totală (preț/oră * număr ore * 100)
    const hours =
      (reservation.endTime.getTime() - reservation.startTime.getTime()) /
      (1000 * 60 * 60);
    const computedAmount = Math.round(field.pricePerHour * hours * 100);
    const finalAmount = computedAmount || Number(amount);

    // Creează o sesiune de checkout Stripe
    const sessionStripe = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "ron",
            product_data: {
              name: `Rezervare teren - ID: ${reservationId}`,
            },
            unit_amount: finalAmount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: { reservationId: reservationId },
      success_url: `${process.env.NEXTAUTH_URL}/fields/${reservation.field}/reserve?selectedDate=${reservation.reservedDate}&reservationId=${reservationId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/fields/${reservation.field}/reserve?selectedDate=${reservation.reservedDate}&reservationId=${reservationId}&canceled=1`,
    });
    return NextResponse.json({ sessionId: sessionStripe.id }, { status: 201 });
  } catch (error) {
    console.error("Eroare la crearea sesiunii de checkout:", error);
    return NextResponse.json(
      { msg: "Eroare la crearea sesiunii de checkout", error: error.message },
      { status: 500 }
    );
  }
}
