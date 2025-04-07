// src/app/api/fields/[id]/route.js (exemplu)

import { NextResponse } from "next/server";
import dbConnect from "../../../../utils/dbConnect";
import Field from "../../../../models/Field";

export async function GET(request, { params }) {
  // extragem id-ul din params
  const { id } = params;

  await dbConnect();
  try {
    const field = await Field.findById(id);
    if (!field) {
      return NextResponse.json({ msg: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ field }, { status: 200 });
  } catch (err) {
    console.error("Eroare la preluarea terenului:", err);
    return NextResponse.json(
      { msg: "Eroare la preluarea terenului", error: err.message },
      { status: 500 }
    );
  }
}
