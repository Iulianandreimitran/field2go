// src/app/profile/update/route.js
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import dbConnect from "../../../utils/dbConnect";
import User from "../../../models/User";

export async function PATCH(request) {
  await dbConnect();

  // Verificăm dacă cererea conține un token JWT în header
  const authHeader = request.headers.get("authorization");
  let userId;

  if (authHeader) {
    // Extragem token-ul din header
    const token = authHeader.split(" ")[1];
    try {
      // Validăm și decodăm token-ul JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "mySecret");
      userId = decoded.userId;
    } catch (err) {
      console.error("Eroare la verificarea JWT:", err);
      return NextResponse.json({ msg: "Invalid token" }, { status: 401 });
    }
  } else {
    // Dacă nu există token JWT, încercăm să obținem sesiunea NextAuth
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ msg: "Unauthorized" }, { status: 401 });
    }
    // Extragem ID-ul utilizatorului din sesiune (setat în NextAuth)
    userId = session.user.id;
  }

  // Parsează corpul cererii pentru a obține noile valori
  let body;
  try {
    body = await request.json();
  } catch (err) {
    return NextResponse.json({ msg: "Invalid JSON" }, { status: 400 });
  }

  const { username, email } = body;
  if (!username || !email) {
    return NextResponse.json({ msg: "Missing parameters" }, { status: 400 });
  }

  try {
    // Găsește utilizatorul după ID și actualizează câmpurile de profil
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username, email },
      { new: true }
    );
    if (!updatedUser) {
      return NextResponse.json({ msg: "User not found" }, { status: 404 });
    }
    // Întoarce noile date ale profilului
    return NextResponse.json(
      { msg: "Profile updated", username: updatedUser.username, email: updatedUser.email },
      { status: 200 }
    );
  } catch (error) {
    console.error("Eroare la actualizarea profilului:", error);
    return NextResponse.json({ msg: "Server error", error: error.message }, { status: 500 });
  }
}
