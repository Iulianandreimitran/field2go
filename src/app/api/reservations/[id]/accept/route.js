// src/app/api/reservations/[id]/accept/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/utils/dbConnect';
import Reservation from '@/models/Reservation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req, { params }) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const currentUserId = session.user.id;
  const reservationId = params.id;

  const reservation = await Reservation.findById(reservationId);
  if (!reservation) {
    return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
  }
  // Verifică dacă userul curent e invitat la această rezervare
  const inviteIndex = reservation.invites.findIndex(uid => uid.toString() === currentUserId);
  if (inviteIndex === -1) {
    // Dacă rezervarea e publică și userul nu era explicit invitat, permite alăturarea directă?
    if (reservation.isPublic) {
      // dacă e publică, permitem alăturarea oricui
    } else {
      return NextResponse.json({ error: 'No invitation for this user' }, { status: 400 });
    }
  }
  // Scoate userul din invites (dacă era în listă)
  if (inviteIndex !== -1) {
    reservation.invites.splice(inviteIndex, 1);
  }
  // Adaugă la participanți dacă nu era deja
  const alreadyParticipant = reservation.participants.some(uid => uid.toString() === currentUserId);
  if (!alreadyParticipant) {
    reservation.participants.push(currentUserId);
  }
  await reservation.save();

  return NextResponse.json({ message: 'Invitation accepted successfully' });
}
