//src/app/api/auth/login/route.js
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "../../../../utils/dbConnect";
import User from "../../../../models/User";

export async function POST(request) {
  await dbConnect(); // Conectare la baza de date

  let body;
  try {
    body = await request.json();
  } catch (error) {
    console.error("Nu s-a putut parsa JSON-ul cererii:", error);
    return NextResponse.json({ msg: "Cerere invalidă." }, { status: 400 });
  }

  const { email, password } = body;

  try {
    // Caută utilizatorul după email
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { msg: "Email sau parolă incorecte." },
        { status: 400 }
      );
    }

    // Compară parola trimisă cu cea hash-uită
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { msg: "Email sau parolă incorecte." },
        { status: 400 }
      );
    }

    // Generează token-ul JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "mySecret",
      { expiresIn: "1h" }
    );

    // Returnează token-ul și username-ul utilizatorului în format JSON
    return NextResponse.json({ token, username: user.username, email: user.email }, { status: 200 });
  } catch (error) {
    console.error("Eroare la autentificare:", error);
    return NextResponse.json(
      { msg: "Eroare de server.", error: error.message },
      { status: 500 }
    );
  }
}