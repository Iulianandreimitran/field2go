// /api/reservations/[id]/accept/route.js
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import dbConnect from '@/utils/dbConnect'
import Reservation from '@/models/Reservation'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function POST(request, context) {
  // 1) Conectare la MongoDB și autentificare
  await dbConnect()
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const currentUserId = session.user.id

  // 2) Extrage ID-ul rezervării
  const { params } = context
  const reservationId = params.id

  // 3) Încarcă rezervarea
  const reservation = await Reservation.findById(reservationId)
  if (!reservation) {
    return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
  }

  // 4) Verifică dacă userul curent e în lista de invitați
  const inviteIndex = reservation.invites.findIndex(
    uid => uid.toString() === currentUserId
  )
  if (inviteIndex === -1) {
    // Dacă nu a fost invitat explicit și rezervarea nu e publică, respinge
    if (!reservation.isPublic) {
      return NextResponse.json(
        { error: 'No invitation for this user' },
        { status: 400 }
      )
    }
    // Dacă e publică, procedăm la adăugare directă
  }

  // 5) Șterge userul din invites dacă era în listă
  if (inviteIndex !== -1) {
    reservation.invites.splice(inviteIndex, 1)
  }

  // 6) Adaugă userul la participanți (dacă nu era deja)
  const alreadyParticipant = reservation.participants.some(
    uid => uid.toString() === currentUserId
  )
  if (!alreadyParticipant) {
    reservation.participants.push(currentUserId)
  }

  // 7) Salvează modificările în bază
  await reservation.save()

  // 8) Trimite răspuns
  return NextResponse.json({ message: 'Invitation accepted successfully' })
}
