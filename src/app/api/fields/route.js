// src/app/api/fields/route.js
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "../../../utils/dbConnect";
import Field from "../../../models/Field";

// GET /api/fields - returnă lista terenurilor
export async function GET() {
  try {
    await dbConnect();
    const fields = await Field.find({});
    return NextResponse.json({ fields }, { status: 200 });
  } catch (error) {
    console.error("Eroare la preluarea terenurilor:", error);
    return NextResponse.json(
      { msg: "Eroare la preluarea terenurilor." },
      { status: 500 }
    );
  }
}

// POST /api/fields - adaugă un nou teren prin token manual
export async function POST(request) {
  try {
    await dbConnect();

    // 1) Citește antetul Authorization
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ msg: "No Authorization header" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];

    // 2) Verifică tokenul
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "mySecret");
    } catch (err) {
      console.error("Eroare la verificarea tokenului:", err);
      return NextResponse.json({ msg: "Invalid token" }, { status: 403 });
    }

    // 3) Verifică rolul
    if (decoded.role !== "admin") {
      return NextResponse.json({ msg: "Forbidden" }, { status: 403 });
    }

    // 4) Citește corpul cererii
    const body = await request.json();
    const { name, location, sportType, pricePerHour, description, base64Image } = body;

    if (!name || !location || !sportType || !pricePerHour) {
      return NextResponse.json({ msg: "Parametri lipsă" }, { status: 400 });
    }

    // 5) Creează obiectul Field
    const newField = new Field({
      name,
      location,
      sportType,
      pricePerHour,
      description,
    });

    // Dacă avem imagine Base64, o adăugăm în array-ul images
    if (base64Image) {
      newField.images.push(base64Image);
    }

    await newField.save();

    return NextResponse.json(
      { msg: "Teren creat cu succes", field: newField },
      { status: 201 }
    );
  } catch (error) {
    console.error("Eroare la crearea terenului:", error);
    return NextResponse.json(
      { msg: "Eroare la crearea terenului.", error: error.message },
      { status: 500 }
    );
  }
}
