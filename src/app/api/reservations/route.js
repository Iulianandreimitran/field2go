// src/app/api/reservations/route.js
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "../../../utils/dbConnect";
import Reservation from "../../../models/Reservation";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(request) {
  try {
    await dbConnect();

    let userId = null;
    let userRole = "user";
    // Încearcă să obțină sesiunea utilizatorului (NextAuth)
    const session = await getServerSession(authOptions);
    if (session) {
      // Utilizator autentificat prin NextAuth (Google/Credentials)
      userId = session.user.id;
      userRole = session.user.role;
    } else {
      // Dacă nu există sesiune NextAuth, verificăm token-ul JWT din antet
      const authHeader = request.headers.get("authorization");
      if (!authHeader) {
        return NextResponse.json({ msg: "Unauthorized" }, { status: 401 });
      }
      const token = authHeader.split(" ")[1];
      try {
        // Verifică validitatea token-ului JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "mySecret");
        // Extract userId și rol din token decodat
        userId = decoded.userId;
        userRole = decoded.role || "user";
      } catch (err) {
        return NextResponse.json({ msg: "Invalid token" }, { status: 403 });
      }
    }

    if (!userId) {
      return NextResponse.json({ msg: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { fieldId, reservedDate, startTime, endTime } = body;

    // Creează rezervarea în baza de date
    const newReservation = await Reservation.create({
      field: fieldId,
      user: userId,
      reservedDate,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
    });

    return NextResponse.json(
      { msg: "Rezervare creată", reservation: newReservation },
      { status: 201 }
    );
  } catch (error) {
    console.error("Eroare la crearea rezervării:", error);
    // Returnăm răspuns JSON cu mesaj de eroare pentru a fi interpretat pe front-end
    return NextResponse.json(
      { msg: "Eroare la crearea rezervării", error: error.message },
      { status: 500 }
    );
  }
}
