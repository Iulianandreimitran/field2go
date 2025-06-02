// src/app/api/reservations/[id]/invite/route.js
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import dbConnect from '@/utils/dbConnect'
import Reservation from '@/models/Reservation'
import User from '@/models/User'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function POST(request, { params }) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const ownerId = session.user.id;
  const reservationId = params.id;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { identifier } = body;
  if (!identifier || typeof identifier !== 'string') {
    return NextResponse.json({ error: 'Email sau username este obligatoriu.' }, { status: 400 });
  }
  const ident = identifier.trim();

  // Lookup user după username sau email
  const invitedUser = await User.findOne({
    $or: [
      { email: new RegExp(`^${ident}$`, 'i') },
      { username: ident }
    ]
  });
  if (!invitedUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  const invitedUserId = invitedUser._id.toString();

  // Load rezervarea și verifică owner
  const reservation = await Reservation.findById(reservationId);
  if (!reservation) {
    return NextResponse.json({ error: 'Rezervarea nu a fost găsită.' }, { status: 404 });
  }
  if (reservation.owner.toString() !== ownerId) {
    return NextResponse.json({ error: 'Doar organizatorul poate trimite invitații.' }, { status: 403 });
  }

  // Previi dublurile
  const alreadyParticipant = reservation.participants
    .map((p) => p.toString())
    .includes(invitedUserId);
  const alreadyInvited = reservation.invites
    .map((i) => i.toString())
    .includes(invitedUserId);
  if (alreadyParticipant || alreadyInvited) {
    return NextResponse.json(
      { error: 'Userul este deja participant sau a fost deja invitat.' },
      { status: 400 }
    );
  }

  // Adaugă în `invites`
  reservation.invites.push(invitedUser._id);
  await reservation.save();

  // Populează invitații pentru răspuns
  await reservation.populate("invites", "username email");

  return NextResponse.json({
    invitedUser: {
      id: invitedUserId,
      username: invitedUser.username,
      email: invitedUser.email,
    },
    invites: reservation.invites.map((u) => ({
      id: u._id.toString(),
      username: u.username,
      email: u.email,
    })),
  });
}
