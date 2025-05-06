// src/app/profile/update/route.js
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import dbConnect from "../../../utils/dbConnect";
import User from "../../../models/User";
import bcrypt from "bcryptjs";

export async function PATCH(request) {
  await dbConnect();

  // Verifică metoda de autentificare: token JWT sau sesiune NextAuth
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
    // Dacă nu există token JWT, folosim sesiunea NextAuth
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ msg: "Unauthorized" }, { status: 401 });
    }
    // Extragem ID-ul utilizatorului din sesiune
    userId = session.user.id;
  }

  // Parsează corpul cererii pentru a obține noile valori
  let body;
  try {
    body = await request.json();
  } catch (err) {
    return NextResponse.json({ msg: "Invalid JSON" }, { status: 400 });
  }

  const { username, email, avatar, bio, currentPassword, newPassword } = body;
  if (!username || !email) {
    return NextResponse.json({ msg: "Missing parameters" }, { status: 400 });
  }

  try {
    // Găsește utilizatorul după ID
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ msg: "User not found" }, { status: 404 });
    }

    // Dacă se dorește schimbarea parolei, verifică și actualizează parola
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ msg: "Parola actuală este necesară." }, { status: 400 });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return NextResponse.json({ msg: "Parola actuală este incorectă." }, { status: 400 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ msg: "Parola nouă trebuie să aibă cel puțin 6 caractere." }, { status: 400 });
      }
      // Hash-uiește noua parolă înainte de salvare
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
    }

    // Actualizează câmpurile avatar și bio (dacă sunt furnizate)
    user.username = username;
    user.email = email;
    if (typeof avatar !== "undefined") {
      user.avatar = avatar;
    }
    if (typeof bio !== "undefined") {
      user.bio = bio;
    }

    await user.save();
    return NextResponse.json({
      msg: "Profile updated",
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio
    }, { status: 200 });
  } catch (error) {
    console.error("Eroare la actualizarea profilului:", error);
    return NextResponse.json({ msg: "Server error", error: error.message }, { status: 500 });
  }
}
