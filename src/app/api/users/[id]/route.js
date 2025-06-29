import { NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import User from "@/models/User";

export async function GET(request, { params }) {
  await dbConnect();

  const userId = params.id;

  try {
    const user = await User.findById(userId).lean();

    if (!user) {
      return NextResponse.json({ error: "Utilizatorul nu a fost găsit." }, { status: 404 });
    }

    return NextResponse.json({
      username: user.username,
      email: user.email,
      bio: user.bio || "",
      avatar: user.avatar || "",
    });
  } catch (err) {
    return NextResponse.json({ error: "Eroare la preluarea utilizatorului." }, { status: 500 });
  }
}
