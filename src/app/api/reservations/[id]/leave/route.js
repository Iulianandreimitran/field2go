// src/app/api/reservations/[id]/leave/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/utils/dbConnect";
import Reservation from "@/models/Reservation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function DELETE(req, context) {

  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const currentUserId = session.user.id;
  const { id: reservationId } = context.params;


  const reservation = await Reservation.findById(reservationId);
  if (!reservation) {
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  }

  const isOwner = reservation.owner.toString() === currentUserId;
  const isParticipant = reservation.participants
    .map((x) => x.toString())
    .includes(currentUserId);

  if (!isOwner && !isParticipant) {
    return NextResponse.json({ error: "Nu ești implicat în această rezervare" }, { status: 403 });
  }

  try {
    if (isOwner) {

      await Reservation.deleteOne({ _id: reservationId });
      return NextResponse.json({ message: "Rezervarea a fost ștearsă." });
    } else {

      reservation.participants = reservation.participants.filter(
        (u) => u.toString() !== currentUserId
      );
      await reservation.save();
      return NextResponse.json({ message: "Ai părăsit rezervarea." });
    }
  } catch (err) {
    console.error("Error in leave route:", err);
    return NextResponse.json({ error: "Eroare la părăsirea rezervării" }, { status: 500 });
  }
}
