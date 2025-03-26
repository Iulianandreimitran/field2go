import { NextResponse } from 'next/server';
import dbConnect from '../../../../utils/dbConnect';
import User from '../../../../models/User';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  // Conectează-te la baza de date
  try {
    await dbConnect();
    console.log("Conexiunea la DB a fost stabilită.");
  } catch (error) {
    console.error("Eroare la conectarea la DB:", error);
    return NextResponse.json({ msg: "Eroare la conectarea la baza de date." }, { status: 500 });
  }

  // Încearcă să parsezi body-ul cererii ca JSON
  let body;
  try {
    body = await request.json();
    console.log("Received body at register:", body);
  } catch (error) {
    console.error("Nu s-a putut parsa JSON-ul cererii:", error);
    return NextResponse.json({ msg: "Cerere invalidă." }, { status: 400 });
  }

  const { username, email, password } = body;

  try {
    // Caută un utilizator existent cu același email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("Utilizatorul există deja:", existingUser);
      return NextResponse.json({ msg: "Utilizatorul există deja." }, { status: 400 });
    }

    // Generează salt și hash pentru parolă
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Creează un nou utilizator
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    console.log("Utilizator creat cu succes:", newUser);

    // Returnează un răspuns JSON valid cu un mesaj de succes
    return NextResponse.json({ msg: "Utilizator înregistrat cu succes." }, { status: 201 });
  } catch (error) {
    console.error("Eroare la crearea utilizatorului:", error);
    return NextResponse.json({ msg: "Eroare de server.", error: error.message }, { status: 500 });
  }
}