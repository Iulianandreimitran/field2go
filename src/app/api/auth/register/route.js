// src/app/api/auth/register/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "../../../../utils/dbConnect";
import User from "../../../../models/User";

export async function POST(request) {
  const { username, email, password } = await request.json();
  if (!username || !email || !password) {
    return NextResponse.json({ msg: "Date incomplete." }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ msg: "Parola trebuie să aibă cel puțin 6 caractere." }, { status: 400 });
  }

  await dbConnect();
  // Verifică dacă există deja un utilizator cu acest email
  const existing = await User.findOne({ email });
  if (existing) {
    return NextResponse.json({ msg: "Adresa de email este deja folosită." }, { status: 409 });
  }

  // Criptează parola înainte de salvare
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await User.create({
    username,
    email,
    password: hashedPassword,
    role: "user", // rol implicit
  });

  return NextResponse.json({ msg: "Înregistrare reușită. Vă puteți autentifica.", userId: newUser._id }, { status: 201 });
}
