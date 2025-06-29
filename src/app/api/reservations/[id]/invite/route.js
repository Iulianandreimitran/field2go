import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/utils/dbConnect";
import Reservation from "@/models/Reservation";
import User from "@/models/User";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getSocketServerInstance } from "@/utils/socketServerInstance";

// === POST /api/reservations/[id]/invite ===
export async function POST(request, context) {
  const params = await context.params;
  const { id } = params;

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUserId = session.user.id;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body invalid" }, { status: 400 });
  }

  const identifier = body.identifier?.trim();
  if (!identifier) {
    return NextResponse.json({ error: "Username/email lipsă" }, { status: 400 });
  }

  await dbConnect();

  const invitedUser = await User.findOne({
    $or: [{ username: identifier }, { email: identifier }],
  }).lean();

  if (!invitedUser) {
    return NextResponse.json({ error: "Utilizatorul nu a fost găsit." }, { status: 404 });
  }

  const reservation = await Reservation.findById(id);

  if (!reservation) {
    return NextResponse.json({ error: "Rezervarea nu a fost găsită." }, { status: 404 });
  }

  if (reservation.owner.toString() !== currentUserId) {
    return NextResponse.json({ error: "Doar organizatorul poate invita." }, { status: 403 });
  }

  const isAlreadyParticipant = reservation.participants.some(
    (p) => p.toString() === invitedUser._id.toString()
  );
  const isAlreadyInvited = reservation.invites.some(
    (i) => i.toString() === invitedUser._id.toString()
  );
  const isOwner = reservation.owner.toString() === invitedUser._id.toString();

  if (isOwner || isAlreadyParticipant || isAlreadyInvited) {
    return NextResponse.json({ error: "Utilizatorul este deja implicat." }, { status: 400 });
  }

  reservation.invites.push(invitedUser._id);
  await reservation.save();

  // 🔔 Emitere notificare socket
  await fetch(`http://localhost:3001/emit-invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      receiverId: invitedUser._id.toString()
    })
  });


  return NextResponse.json({ success: true });
}
