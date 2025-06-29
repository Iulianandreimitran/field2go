// src/app/api/reservations/[id]/kick/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/utils/dbConnect";
import Reservation from "@/models/Reservation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req, context) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const currentUserId = session.user.id;
  const { id: reservationId } = context.params;
  const { userId: kickUserId } = await req.json();


  const reservation = await Reservation.findById(reservationId);
  if (!reservation) {
    return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
  }


  if (reservation.owner.toString() !== currentUserId) {
    return NextResponse.json({ error: "Nu ai dreptul să dai kick" }, { status: 403 });
  }


  const exists = reservation.participants.some((p) => p.toString() === kickUserId);
  if (!exists) {
    return NextResponse.json({ error: "Userul nu este participant" }, { status: 404 });
  }

  try {
    reservation.participants = reservation.participants.filter(
      (p) => p.toString() !== kickUserId
    );
    await reservation.save();
    return NextResponse.json({ message: "Participant eliminat cu succes." });
  } catch (err) {
    console.error("Error in kick route:", err);
    return NextResponse.json({ error: "Eroare la kick participant" }, { status: 500 });
  }
}
