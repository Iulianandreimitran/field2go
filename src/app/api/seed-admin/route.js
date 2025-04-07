// src/app/api/seed-admin/route.js
import { NextResponse } from "next/server";
import dbConnect from "../../../utils/dbConnect";
import User from "../../../models/User";
import bcrypt from "bcryptjs";

export async function GET() {
  await dbConnect();

  const email = "admin@example.com"; // email-ul contului admin
  const password = "parola_admin"; // parola pentru contul admin – schimb-o după preferințe

  try {
    let adminUser = await User.findOne({ email });
    if (adminUser) {
      // Dacă contul există deja, actualizăm rolul la "admin"
      adminUser.role = "admin";
      await adminUser.save();
      return NextResponse.json({ msg: "Contul admin a fost actualizat." }, { status: 200 });
    } else {
      // Dacă contul nu există, îl creăm
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const newAdmin = new User({
        username: "Admin",
        email: email,
        password: hashedPassword,
        role: "admin",
      });
      await newAdmin.save();
      return NextResponse.json({ msg: "Contul admin a fost creat." }, { status: 201 });
    }
  } catch (error) {
    console.error("Eroare la crearea contului admin:", error);
    return NextResponse.json(
      { msg: "Eroare la crearea contului admin.", error: error.message },
      { status: 500 }
    );
  }
}
