// app/api/fields/available/route.js
import { NextResponse } from "next/server";
import dbConnect from "../../../../utils/dbConnect";
import Field from "../../../../models/Field";
import Reservation from "../../../../models/Reservation";

export async function GET(request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  let dateParam = searchParams.get("date");
  const dateStr =
    dateParam === "today"
      ? new Date().toISOString().substring(0, 10)
      : dateParam;
  const reservations = await Reservation.find({ reservedDate: dateStr });
  const reservedIds = reservations.map((r) => r.field.toString());
  const available = await Field.find({ _id: { $nin: reservedIds } });
  return NextResponse.json(available);
}
