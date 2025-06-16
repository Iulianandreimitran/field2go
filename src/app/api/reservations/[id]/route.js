// src/app/api/reservations/[id]/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/utils/dbConnect";
import Reservation from "@/models/Reservation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// === GET /api/reservations/[id] ===
export async function GET(request, context) {
  const { id } = context.params;

  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Trebuie să fii autentificat pentru a vedea această rezervare." },
      { status: 401 }
    );
  }

  const currentUserId = session.user.id;

  let reservation;
  try {
    reservation = await Reservation.findById(id)
      .populate("field", "name")
      .populate("owner", "username email")
      .populate("participants", "username email")
      .populate("invites", "username email")
      .populate("messages.sender", "username email");
  } catch (err) {
    console.error("Eroare la găsirea rezervării:", err);
    return NextResponse.json(
      { error: "Eroare server la obținerea rezervării." },
      { status: 500 }
    );
  }

  if (!reservation) {
    return NextResponse.json(
      { error: "Rezervarea nu a fost găsită." },
      { status: 404 }
    );
  }

  const isOwner = reservation.owner._id.toString() === currentUserId;
  const isParticipant = (reservation.participants || [])
    .map((u) => u._id.toString())
    .includes(currentUserId);

  if (!isOwner && !isParticipant) {
    return NextResponse.json(
      { error: "Nu ai acces să vizualizezi această rezervare." },
      { status: 403 }
    );
  }

  const resObj = reservation.toObject();

  if (Array.isArray(resObj.messages)) {
    resObj.messages = resObj.messages.map((msg) => ({
      sender:
        msg.sender && typeof msg.sender === "object"
          ? msg.sender.username || msg.sender.email || "User"
          : msg.sender || "User",
      text: msg.text,
      timestamp: msg.timestamp,
    }));
  }

  return NextResponse.json(resObj);
}

// === PATCH /api/reservations/[id] ===
export async function PATCH(request, context) {
  const { id } = context.params;

  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Trebuie să fii autentificat pentru a modifica această rezervare." },
      { status: 401 }
    );
  }

  const currentUserId = session.user.id;

  let reservation;
  try {
    reservation = await Reservation.findById(id);
  } catch (err) {
    console.error("Eroare la găsirea rezervării:", err);
    return NextResponse.json(
      { error: "Eroare server la obținerea rezervării." },
      { status: 500 }
    );
  }

  if (!reservation) {
    return NextResponse.json(
      { error: "Rezervarea nu a fost găsită." },
      { status: 404 }
    );
  }

  if (reservation.owner.toString() !== currentUserId) {
    return NextResponse.json(
      { error: "Nu ai dreptul să modifici această rezervare." },
      { status: 403 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalid." }, { status: 400 });
  }

  const { isPublic } = body;
  if (typeof isPublic !== "boolean") {
    return NextResponse.json(
      { error: "Lipsește valoarea isPublic sau e de tip incorect." },
      { status: 400 }
    );
  }

  reservation.isPublic = isPublic;

  try {
    await reservation.save();
  } catch (err) {
    console.error("Eroare la salvarea rezervării:", err);
    return NextResponse.json(
      { error: "Eroare la actualizarea rezervării." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, isPublic: reservation.isPublic });
}
