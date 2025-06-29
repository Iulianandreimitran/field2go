// src/app/api/reservations/[id]/accept/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/utils/dbConnect";
import Reservation from "@/models/Reservation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request, { params }) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const currentUserId = session.user.id;
  const reservationId = params.id;

  const reservation = await Reservation.findById(reservationId);
  if (!reservation) {
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  }

  const inviteIndex = reservation.invites.findIndex(
    (uid) => uid.toString() === currentUserId
  );
  if (inviteIndex === -1) {
    if (!reservation.isPublic) {
      return NextResponse.json({ error: "No invitation for this user" }, { status: 400 });
    }
  }

  if (inviteIndex !== -1) {
    reservation.invites.splice(inviteIndex, 1);
  }

  const alreadyParticipant = reservation.participants.some(
    (uid) => uid.toString() === currentUserId
  );
  if (!alreadyParticipant) {
    reservation.participants.push(currentUserId);
  }

  await reservation.save();
  return NextResponse.json({ message: "Invitation accepted successfully" });
}
