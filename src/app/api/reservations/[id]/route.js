// src/app/api/reservations/[id]/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/utils/dbConnect";
import Reservation from "@/models/Reservation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request, { params }) {
  await dbConnect();

  // 1) Luăm sesiunea curentă (dacă există)
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Trebuie să fii autentificat pentru a vedea această rezervare." },
      { status: 401 }
    );
  }
  const currentUserId = session.user.id;

  // 2) Încarcă rezervarea și populează owner, participants, invites etc.
  let reservation;
  try {
    reservation = await Reservation.findById(params.id)
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

  // 3) Verifică dacă userul curent e owner sau participant
  const isOwner = reservation.owner._id.toString() === currentUserId;
  const isParticipant = (reservation.participants || [])
    .map((u) => u._id.toString())
    .includes(currentUserId);

  if (!isOwner && !isParticipant) {
    // Dacă nu ești owner și nici participant, nu ai voie să accesezi
    return NextResponse.json(
      { error: "Nu ai acces să vizualizezi această rezervare." },
      { status: 403 }
    );
  }

  // 4) Dacă ai acces, transformă rezervarea într‐un obiect JSON simplu
  const resObj = reservation.toObject();

  // 4.a) Aplatizează câmpul `messages.sender` ca să fie un simplu username/email
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

  // 5) Trimite răspunsul JSON
  return NextResponse.json(resObj);
}


export async function PATCH(request, { params }) {
  await dbConnect();

  // 1) Verifică sesiunea
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Trebuie să fii autentificat pentru a modifica această rezervare." },
      { status: 401 }
    );
  }
  const currentUserId = session.user.id;

  // 2) Încarcă rezervarea
  let reservation;
  try {
    reservation = await Reservation.findById(params.id);
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

  // 3) Permisiune: doar owner-ul poate schimba proprietatea `isPublic`
  if (reservation.owner.toString() !== currentUserId) {
    return NextResponse.json(
      { error: "Nu ai dreptul să modifici această rezervare." },
      { status: 403 }
    );
  }

  // 4) Citește corpul PATCH-ului și actualizează
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "JSON invalid." },
      { status: 400 }
    );
  }

  const { isPublic } = body;
  if (typeof isPublic !== "boolean") {
    return NextResponse.json(
      { error: "Lipă valoarea isPublic sau e de tip incorect." },
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
