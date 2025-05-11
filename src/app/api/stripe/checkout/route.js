// src/app/api/stripe/checkout/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import dbConnect from '@/utils/dbConnect';
import Reservation from '@/models/Reservation';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    await dbConnect();
    const { reservationId, amount } = await req.json();
    if (!reservationId) {
      return NextResponse.json({ error: 'Missing reservationId' }, { status: 400 });
    }

    // Găsește rezervarea și câmpul asociat
    const reservation = await Reservation.findById(reservationId).populate('field');
    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }
    const field = reservation.field;
    if (!field) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    // Calculează suma totală pe baza duratei și a prețului pe oră
    const hours = reservation.duration;  // număr ore rezervate
    const computedAmount = Math.round(field.pricePerHour * hours * 100);
    const finalAmount = computedAmount || Number(amount);

        // Obține origin pentru URL-uri dinamice
    const { origin } = new URL(req.url);

    // Creare sesiune Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'ron',
          product_data: {
            name: `Rezervare ${field.name} pe ${reservation.date.toLocaleDateString()}`,
          },
          unit_amount: finalAmount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/fields/${field._id}`,
      metadata: {
        reservationId: reservation._id.toString(),
        userId: reservation.owner.toString(),
        fieldId: field._id.toString(),
        date: reservation.date.toISOString(),
        startTime: reservation.startTime,
        duration: reservation.duration.toString(),
        isPublic: reservation.isPublic ? '1' : '0',
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json({ error: 'Eroare la crearea sesiunii de checkout' }, { status: 500 });
  }
}
