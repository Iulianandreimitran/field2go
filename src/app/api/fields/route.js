// src/app/api/fields/route.js
import { NextResponse } from "next/server";
import dbConnect from "../../../utils/dbConnect";
import Field from "../../../models/Field";

// GET /api/fields - returnează lista tuturor terenurilor
export async function GET() {
  try {
    await dbConnect();
    const fields = await Field.find({});
    return NextResponse.json({ fields }, { status: 200 });
  } catch (error) {
    console.error("Eroare la preluarea terenurilor:", error);
    return NextResponse.json(
      { msg: "Eroare la preluarea terenurilor." },
      { status: 500 }
    );
  }
}