// src/app/api/users/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/utils/dbConnect";
import User from "@/models/User";

export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("search") || "";

  const users = await User.find({
    username: { $regex: query, $options: "i" }
  })
    .select("username email")
    .limit(10)
    .lean();

  return NextResponse.json(users);
}
