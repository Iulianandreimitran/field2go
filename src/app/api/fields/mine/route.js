// src/app/api/fields/mine/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "@/utils/dbConnect";
import Field from "@/models/Field";

export async function GET() {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ msg: "Unauthorized" }, { status: 401 });
  }

  const fields = await Field.find({ owner: session.user.id });
  return NextResponse.json({ fields });
}
