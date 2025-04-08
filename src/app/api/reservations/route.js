import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "../../../utils/dbConnect";
import Reservation from "../../../models/Reservation";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const fieldId = searchParams.get("fieldId");
    if (!fieldId) {
      return NextResponse.json({ msg: "fieldId is required" }, { status: 400 });
    }
    // Fetch only reservations that are paid or pending (not expired)
    const now = new Date();
    const reservations = await Reservation.find({
      field: fieldId,
      $or: [
        { status: "paid" },
        { status: "pending", expiresAt: { $gte: now } }
      ]
    });
    return NextResponse.json({ reservations }, { status: 200 });
  } catch (error) {
    console.error("Error fetching reservations:", error);
    return NextResponse.json(
      { msg: "Error fetching reservations", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    let userId = null;
    let userRole = "user";
    // Încearcă să obțină sesiunea utilizatorului (NextAuth) sau token JWT
    const session = await getServerSession(authOptions);
    if (session) {
      userId = session.user.id;
      userRole = session.user.role;
    } else {
      const authHeader = request.headers.get("authorization");
      if (!authHeader) {
        return NextResponse.json({ msg: "Unauthorized" }, { status: 401 });
      }
      const token = authHeader.split(" ")[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "mySecret");
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
    // Creează rezervarea cu status "pending" și expirare peste 2 minute
    const newReservation = await Reservation.create({
      field: fieldId,
      user: userId,
      reservedDate,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      status: "pending",
      expiresAt: new Date(Date.now() + 2 * 60 * 1000)
    });
    return NextResponse.json(
      { msg: "Rezervare creată", reservation: newReservation },
      { status: 201 }
    );
  } catch (error) {
    console.error("Eroare la crearea rezervării:", error);
    return NextResponse.json(
      { msg: "Eroare la crearea rezervării", error: error.message },
      { status: 500 }
    );
  }
}
