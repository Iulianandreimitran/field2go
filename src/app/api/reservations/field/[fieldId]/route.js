import { NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Reservation from "@/models/Reservation";
import Field from "@/models/Field";

export async function GET(_, { params }) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ msg: "Neautorizat" }, { status: 401 });
  }

  const field = await Field.findById(params.fieldId);
  if (!field || field.owner.toString() !== session.user.id) {
    return NextResponse.json({ msg: "Acces interzis" }, { status: 403 });
  }

  const reservations = await Reservation.find({ field: params.fieldId }) 
    .populate("owner", "username email") 
    .sort({ date: -1 });

  return NextResponse.json({ reservations, field });
}
