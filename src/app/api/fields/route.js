import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/utils/dbConnect";
import Field from "@/models/Field";

export async function GET() {
  try {
    await dbConnect();
    const fields = await Field.find({});
    return NextResponse.json(fields, { status: 200 });
  } catch (error) {
    console.error("Eroare la preluarea terenurilor:", error);
    return NextResponse.json(
      { error: "Eroare la preluarea terenurilor." },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Acces interzis. Doar adminii pot adăuga terenuri." }, { status: 403 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Datele trimise nu sunt valide." }, { status: 400 });
  }

  const { name, location, sportType, pricePerHour, description, base64Image } = body;
  if (!name || !location || !sportType || !pricePerHour) {
    return NextResponse.json({ error: "Toate câmpurile obligatorii trebuie completate." }, { status: 400 });
  }

  try {
    const newField = await Field.create({
      name,
      location,
      sportType,
      pricePerHour,
      description,
      owner: session.user.id,
      images: base64Image ? [base64Image] : [],
    });

    return NextResponse.json({ success: true, field: newField }, { status: 201 });
  } catch (err) {
    console.error("Eroare la crearea terenului:", err);
    return NextResponse.json({ error: "Eroare server la crearea terenului." }, { status: 500 });
  }
}
