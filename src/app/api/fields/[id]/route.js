import { NextResponse } from "next/server";
import dbConnect from "../../../../utils/dbConnect";
import Field from "../../../../models/Field";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(_, { params }) {
  const { id } = params;
  await dbConnect();

  try {
    const field = await Field.findById(id);
    if (!field) {
      return NextResponse.json({ msg: "Terenul nu a fost găsit" }, { status: 404 });
    }
    return NextResponse.json({ field }, { status: 200 });
  } catch (err) {
    console.error("Eroare GET:", err);
    return NextResponse.json({ msg: "Eroare", error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { id } = params;
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ msg: "Neautorizat" }, { status: 401 });
  }

  try {
    const field = await Field.findById(id);
    if (!field || field.owner.toString() !== session.user.id) {
      return NextResponse.json({ msg: "Acces interzis" }, { status: 403 });
    }

    const body = await request.json();
    field.name = body.name;
    field.location = body.location;
    field.sportType = body.sportType;
    field.pricePerHour = body.pricePerHour;
    field.description = body.description;
    await field.save();

    return NextResponse.json({ msg: "Teren actualizat cu succes", field });
  } catch (err) {
    console.error("Eroare PUT:", err);
    return NextResponse.json({ msg: "Eroare la actualizare", error: err.message }, { status: 500 });
  }
}

export async function DELETE(_, { params }) {
  const { id } = params;
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ msg: "Neautorizat" }, { status: 401 });
  }

  try {
    const field = await Field.findById(id);
    if (!field || field.owner.toString() !== session.user.id) {
      return NextResponse.json({ msg: "Acces interzis" }, { status: 403 });
    }

    await field.deleteOne();
    return NextResponse.json({ msg: "Teren șters cu succes" }, { status: 200 });
  } catch (err) {
    console.error("Eroare DELETE:", err);
    return NextResponse.json({ msg: "Eroare la ștergere", error: err.message }, { status: 500 });
  }
}
