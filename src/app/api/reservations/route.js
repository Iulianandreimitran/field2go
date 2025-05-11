// src/app/api/reservations/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/utils/dbConnect';
import Reservation from '@/models/Reservation';
import Field from '@/models/Field';
import User from '@/models/User';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';  // NextAuth config

export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);

  // Dacă se cere disponibilitate pe un teren (fără autentificare)
  const fieldId = searchParams.get('fieldId');
  if (fieldId) {
    // Returnează toate rezervările pentru acel field (poți filtra și după data în front-end)
    const fieldReservations = await Reservation.find({ field: fieldId });
    return NextResponse.json({ reservations: fieldReservations });
  }

  // Pentru listări private/public/mine/invited, necesită autentificare
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const currentUserId = session.user.id;
  const isMine = searchParams.get('mine');
  const isPublic = searchParams.get('public');
  const isInvited = searchParams.get('invited');

  let filter = { status: 'active' };
  if (isMine) {
    filter.$or = [
      { owner: currentUserId },
      { participants: currentUserId }
    ];
  } else if (isPublic) {
    filter.isPublic = true;
  } else if (isInvited) {
    filter.invites = currentUserId;
  } else {
    filter.$or = [
      { owner: currentUserId },
      { participants: currentUserId }
    ];
  }

  const reservations = await Reservation.find(filter)
    .populate('field')
    .populate('owner', 'username email')
    .populate('participants', 'username email')
    .populate('invites', 'username email');

  return NextResponse.json(reservations);
}

export async function POST(req) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  // Permite rezervări doar utilizatorilor autentificați
  let userId = null;
  if (session && session.user) {
    userId = session.user.id;
  } else {
    // În mod normal folosim JWT manual stocat, dar aici obligăm NextAuth
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Obține datele trimise de client
  const { fieldId, reservedDate, startTime, endTime } = await req.json();
  if (!fieldId || !reservedDate || !startTime || !endTime) {
    return NextResponse.json({ error: 'Lipsesc datele pentru rezervare' }, { status: 400 });
  }

  // Creează rezervarea cu status pending
  const start = new Date(startTime);
  const end = new Date(endTime);
  const durationHours = (end - start) / (1000 * 60 * 60);

  try {
    const newReservation = await Reservation.create({
      field: fieldId,
      owner: userId,
      date: reservedDate,
      startTime: startTime.slice(11, 16), // 'HH:mm'
      duration: durationHours,
      isPublic: false,
      status: 'pending',
      participants: [],
      invites: [],
      messages: []
    });
    return NextResponse.json({ reservation: newReservation }, { status: 201 });
  } catch (err) {
    console.error('Reservation creation error:', err);
    return NextResponse.json({ error: 'Eroare la crearea rezervării' }, { status: 500 });
  }
}
