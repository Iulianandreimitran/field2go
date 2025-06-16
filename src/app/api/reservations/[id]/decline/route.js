// src/app/api/reservations/[id]/decline/route.js
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Reservation from "@/models/Reservation";

export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const reservation = await Reservation.findById(params.id);
  if (!reservation) {
    return NextResponse.json({ error: "Rezervarea nu a fost găsită" }, { status: 404 });
  }

  reservation.invites = reservation.invites.filter(id => id.toString() !== session.user.id);
  await reservation.save();

  return NextResponse.json({ success: true });
}
