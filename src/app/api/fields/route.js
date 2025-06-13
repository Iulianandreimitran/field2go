import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "../../../utils/dbConnect";
import Field from "../../../models/Field";
import User from "../../../models/User";

// GET /api/fields - returnă toate terenurile (public)
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

// POST /api/fields - adaugă un teren și îl leagă de adminul logat
export async function POST(request) {
  try {
    await dbConnect();

    // 1) Citește antetul Authorization
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ msg: "Lipsește tokenul." }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];

    // 2) Decodează și verifică tokenul
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "mySecret");
    } catch (err) {
      console.error("Token invalid:", err);
      return NextResponse.json({ msg: "Token invalid." }, { status: 403 });
    }

    // 3) Verifică rolul și existența utilizatorului
    const user = await User.findById(decoded.id);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ msg: "Acces interzis. Doar adminii pot adăuga terenuri." }, { status: 403 });
    }

    // 4) Preia datele din body
    const body = await request.json();
    const { name, location, sportType, pricePerHour, description, base64Image } = body;

    if (!name || !location || !sportType || !pricePerHour) {
      return NextResponse.json({ msg: "Parametri lipsă" }, { status: 400 });
    }

    // 5) Creează noul teren cu owner setat
    const newField = new Field({
      name,
      location,
      sportType,
      pricePerHour,
      description,
      owner: user._id, // 🔗 legăm terenul de admin
      images: base64Image ? [base64Image] : [],
    });

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
