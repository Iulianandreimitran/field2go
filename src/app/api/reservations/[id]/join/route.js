// src/app/api/reservations/[id]/join/route.js
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
  if (!reservation || reservation.status !== 'active') {
    return NextResponse.json({ error: 'Reservation not available' }, { status: 404 });
  }
  if (!reservation.isPublic) {
    return NextResponse.json({ error: 'Reservation is not public' }, { status: 403 });
  }

  const alreadyParticipant = reservation.participants.some(uid => uid.toString() === currentUserId);
  if (alreadyParticipant) {
    return NextResponse.json({ error: 'Already joined' }, { status: 400 });
  }

  reservation.participants.push(currentUserId);
  await reservation.save();
  return NextResponse.json({ message: 'Joined reservation successfully' });
}
