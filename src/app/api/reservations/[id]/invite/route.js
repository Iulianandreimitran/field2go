// src/app/api/reservations/[id]/invite/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect';
import Reservation from '@/models/Reservation';
import User from '@/models/User';

export async function POST(request, { params }) {
  await dbConnect();
  const reservationId = params.id;
  try {
    const { identifier } = await request.json();
    if (!identifier || identifier.trim() === '') {
      return NextResponse.json({ error: 'Trebuie să furnizați un email sau username.' }, { status: 400 });
    }
    // Găsește utilizatorul după email sau username
    const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
    if (!user) {
      return NextResponse.json({ error: 'Utilizatorul nu există.' }, { status: 404 });
    }
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return NextResponse.json({ error: 'Rezervarea nu a fost găsită.' }, { status: 404 });
    }
    // (Opțional) verificați dacă utilizatorul curent este owner-ul rezervării
    // Verifică dacă utilizatorul este deja owner, participant sau invitat
    if (reservation.owner.toString() === user._id.toString() ||
        reservation.participants.some(part => part.toString() === user._id.toString()) ||
        reservation.invites.some(inv => inv.toString() === user._id.toString())) {
      return NextResponse.json({ error: 'Utilizatorul este deja invitat sau participant la această rezervare.' }, { status: 400 });
    }
    // Adaugă utilizatorul la invitații rezervării
    reservation.invites.push(user._id);
    await reservation.save();
    // Populează invitații pentru a returna datele actualizate (username, email)
    await reservation.populate('invites', 'username email');
    return NextResponse.json({ invites: reservation.invites });
  } catch (err) {
    console.error('Eroare la invitarea utilizatorului:', err);
    return NextResponse.json({ error: 'Eroare server la invitarea utilizatorului.' }, { status: 500 });
  }
}
