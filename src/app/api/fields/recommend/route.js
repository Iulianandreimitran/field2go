// app/api/fields/recommend/route.js
import { NextResponse } from "next/server";
import dbConnect from "../../../../utils/dbConnect";
import Field from "../../../../models/Field";

export async function GET(request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  // Găsește cel mai bine cotat teren de tipul cerut
  const field = await Field.findOne({ type }).sort({ rating: -1 });
  if (field) return NextResponse.json(field);
  return NextResponse.json({}, { status: 404 });
}
