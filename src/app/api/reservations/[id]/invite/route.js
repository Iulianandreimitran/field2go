// src/app/api/reservations/[id]/invite/route.js

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import dbConnect from '@/utils/dbConnect'
import Reservation from '@/models/Reservation'
import User from '@/models/User'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function POST(request, { params }) {
  // 1) Connect & auth
  await dbConnect()
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id

  // 2) Grab reservation ID
  const reservationId = params.id

  // 3) Read the identifier (email or username)
  const { identifier } = await request.json()
  if (!identifier || typeof identifier !== 'string') {
    return NextResponse.json(
      { error: 'Email sau username este obligatoriu.' },
      { status: 400 }
    )
  }
  const ident = identifier.trim()

  // 4) Lookup user case-insensitive on email OR exact on username
  const invitedUser = await User.findOne({
    $or: [
      { email: new RegExp(`^${ident}$`, 'i') },
      { username: ident }
    ]
  })
  if (!invitedUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // 5) Load reservation & verify you’re the owner
  const reservation = await Reservation.findById(reservationId)
  if (!reservation) {
    return NextResponse.json(
      { error: 'Rezervarea nu a fost găsită.' },
      { status: 404 }
    )
  }
  if (reservation.owner.toString() !== userId) {
    return NextResponse.json(
      { error: 'Doar organizatorul poate trimite invitații.' },
      { status: 403 }
    )
  }

  // 6) Prevent duplicates
  const inviteId = invitedUser._id.toString()
  if (
    reservation.participants.map(p => p.toString()).includes(inviteId) ||
    reservation.invites.map(i => i.toString()).includes(inviteId)
  ) {
    return NextResponse.json(
      { error: 'Userul este deja participant sau invitat.' },
      { status: 400 }
    )
  }

  // 7) Add to invites & save
  reservation.invites.push(invitedUser._id)
  await reservation.save()

  // 8) Populate for response
  await reservation.populate('invites', 'username email')

  // 9) Return the newly invited user + full invites list
  return NextResponse.json({
    invitedUser: {
      id: inviteId,
      username: invitedUser.username,
      email: invitedUser.email
    },
    invites: reservation.invites.map(u => ({
      id: u._id.toString(),
      username: u.username,
      email: u.email
    }))
  })
}
