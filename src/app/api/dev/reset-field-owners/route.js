// src/app/api/dev/reset-field-owners/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import Field from "@/models/Field";

export async function GET() {
  try {
    await dbConnect();

    // Șterge ownerii din toate terenurile
    const result = await Field.updateMany({}, { $unset: { owner: "" } });

    return NextResponse.json({
      msg: "Toți ownerii au fost șterși.",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Eroare la resetarea ownerilor:", error);
    return NextResponse.json({ msg: "Eroare.", error: error.message }, { status: 500 });
  }
}
