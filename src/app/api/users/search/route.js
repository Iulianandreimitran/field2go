// app/api/users/search/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import User from "@/models/User";

export async function GET(request) {
  await dbConnect();

  const url = new URL(request.url);
  const q = url.searchParams.get("query")?.trim().toLowerCase() || "";
  if (!q) return NextResponse.json([]);

  const users = await User.find(
    { 
      role: { $ne: "admin" }, 
      $or: [
        { username: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ],
    },
    { username: 1, email: 1 } // luăm doar câmpurile necesare
  );

  const results = users.map((u) => ({
    id: u._id.toString(),
    name: u.username, // atenție: aici `name` trebuie să fie exact `username`
    email: u.email,
  }));

  // Sortare după relevanță (prefix mai întâi, apoi lungime mai scurtă)
  results.sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    const startsA = aName.startsWith(q);
    const startsB = bName.startsWith(q);
    if (startsA && !startsB) return -1;
    if (!startsA && startsB) return 1;
    return aName.length - bName.length;
  });

  return NextResponse.json(results);
}
