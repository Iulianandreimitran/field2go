// src/app/api/reservations/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/utils/dbConnect";
import Reservation from "@/models/Reservation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

//
// ──────────────────────────────────────────────────────────────────────────────
//   GET /api/reservations
//   - poate primi parametrii query: field=<idTeren>&date=YYYY-MM-DD
//   - sau ?public=true, ?mine=true, ?invited=true
// ──────────────────────────────────────────────────────────────────────────────
//
export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);

  const fieldId   = searchParams.get("field");               // ?field=<idTeren>
  const date      = searchParams.get("date");                // ?date=YYYY-MM-DD
  const isPublic  = searchParams.get("public") === "true";   // ?public=true
  const isMine    = searchParams.get("mine")   === "true";   // ?mine=true
  const isInvited = searchParams.get("invited")=== "true";   // ?invited=true

  // 1) Dacă au fost trimise parametrii ?field=<id>&date=<YYYY-MM-DD>,
  //    respondem doar cu rezervările de pe acel teren în acea zi (fără autentificare).
  if (fieldId && date) {
    const reservations = await Reservation.find({
      field: fieldId,
      date:  date
    }).lean();
    return NextResponse.json(reservations);
  }

  // 2) Dacă vine ?public=true, returnăm rezervările publice active
  if (isPublic) {
    const reservations = await Reservation.find({
      isPublic: true,
      status:   "active"
    })
      .populate("field", "name")
      .populate("owner", "username email")
      .populate("participants", "username email")
      .lean();

    return NextResponse.json(reservations);
  }

  // 3) Ramurile mine/invited necesită autentificare
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const currentUserId = session.user.id;

  let filter = {};

  if (isMine) {
    // Rezervările mele: fie sunt owner, fie participant, cu status = pending sau active
    filter = {
      $or: [
        { owner: currentUserId },
        { participants: currentUserId }
      ],
      status: { $in: ["pending", "active"] }
    };
  } else if (isInvited) {
    // Invitațiile mele: invites conține ID‐ul meu, cu status = pending
    filter = {
      invites: currentUserId,
      status:  "pending"
    };
  } else {
    // Alte situații (fără parametri speciali): doar rezervările active unde sunt implicat
    filter = {
      $or: [
        { owner: currentUserId },
        { participants: currentUserId }
      ],
      status: "active"
    };
  }

  const reservations = await Reservation.find(filter)
    .populate("field", "name")
    .populate("owner", "username email")
    .populate("participants", "username email")
    .populate("invites", "username email")
    .lean();

  return NextResponse.json(reservations);
}



//
// ──────────────────────────────────────────────────────────────────────────────
//   POST /api/reservations
//   – crează o rezervare cu status = "pending" (fără autentificare e 401)
//   – body JSON: { fieldId, reservedDate, startTime, duration }
// ──────────────────────────────────────────────────────────────────────────────
//
export async function POST(req) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const currentUserId = session.user.id;

  // 1) Citim JSON‐ul trimis
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { fieldId, reservedDate, startTime, duration } = body;
  if (!fieldId || !reservedDate || !startTime || !duration) {
    return NextResponse.json(
      { error: "Lipsesc datele necesare rezervării." },
      { status: 400 }
    );
  }

  // 2) Creăm documentul de tip „Reservation” cu status = "pending"
  try {
    const newReservation = await Reservation.create({
      field:        fieldId,                         // ObjectId al terenului
      owner:        currentUserId,                   // ID‐ul userului curent
      date:         reservedDate,                    // ex: "2025-06-21"
      startTime:    startTime,                       // ex: "14:00"
      duration:     parseInt(duration, 10),          // ex: 2 (ore)
      isPublic:     false,                           // default false
      status:       "pending",                       // până la confirmarea plății
      participants: [],                              // inițial gol
      invites:      [],                              // inițial gol
      messages:     []                               // inițial gol
    });

    // 3) Returnăm întreaga rezervare, ca să știe clientul reservation._id
    return NextResponse.json({ reservation: newReservation }, { status: 201 });
  } catch (err) {
    console.error("Reservation creation error:", err);
    return NextResponse.json(
      { error: "Eroare la crearea rezervării." },
      { status: 500 }
    );
  }
}
