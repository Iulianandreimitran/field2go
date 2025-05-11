// src/app/api/stripe/verify/route.js
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import dbConnect from '@/utils/dbConnect';
import Reservation from '@/models/Reservation';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    await dbConnect();
    const { sessionId } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    // Preia sesiunea de checkout de la Stripe (fără expand pe metadata)
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not confirmed' }, { status: 400 });
    }

    // Extrage metadata (detaliile rezervării)
    const meta = session.metadata || {};
    const userId    = meta.userId;
    const fieldId   = meta.fieldId;
    const date      = meta.date ? new Date(meta.date) : null;
    const startTime = meta.startTime;
    const duration  = meta.duration ? parseInt(meta.duration, 10) : 0;
    const isPublic  = meta.isPublic === '1';

    if (!userId || !fieldId || !date || !startTime || !duration) {
      return NextResponse.json({ error: 'Missing reservation details' }, { status: 400 });
    }

    // Creează rezervarea în DB
    const newReservation = await Reservation.create({
      field: fieldId,
      owner: userId,
      date,
      startTime,
      duration,
      isPublic,
      status: 'active',
      participants: [],
      invites: [],
      messages: []
    });

    return NextResponse.json({ reservationId: newReservation._id, status: newReservation.status });
  } catch (err) {
    console.error('Stripe verify error:', err);
    return NextResponse.json({ error: 'Eroare la verificarea plății.' }, { status: 500 });
  }
}
