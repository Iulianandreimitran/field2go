// src/app/api/fields/seed/route.js
import { NextResponse } from "next/server";
import dbConnect from "../../../../utils/dbConnect";
import Field from "../../../../models/Field";

export async function GET() {
  try {
    await dbConnect();
    // Ștergem terenurile existente pentru a reinițializa DB
    await Field.deleteMany({});

    const sampleFields = [
      {
        name: "Teren Fotbal Central",
        location: "Str. Stadionului 1, București",
        sportType: "Fotbal",
        pricePerHour: 120,
        description: "Teren cu iarbă artificială, vestiare și iluminat nocturn.",
        coordinates: { lat: 44.4268, lng: 26.1025 },
        images: ["/images/fotbal1.jpg"],
      },
      {
        name: "Teren Baschet Outdoor",
        location: "Bd. Baschetului 10, București",
        sportType: "Baschet",
        pricePerHour: 80,
        description: "Teren exterior cu suprafață cauciucată.",
        coordinates: { lat: 44.4270, lng: 26.1030 },
        images: ["/images/baschet1.jpg"],
      },
      {
        name: "Teren Tenis Acoperit",
        location: "Calea Tenisului 99, Cluj-Napoca",
        sportType: "Tenis",
        pricePerHour: 150,
        description: "Teren acoperit, suprafață sintetică, iluminat nocturn.",
        coordinates: { lat: 46.7712, lng: 23.6236 },
        images: ["/images/tenis1.jpg"],
      },
    ];

    await Field.insertMany(sampleFields);
    return NextResponse.json({ msg: "Seed completat cu succes!" }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ msg: "Eroare la popularea terenurilor." }, { status: 500 });
  }
}
