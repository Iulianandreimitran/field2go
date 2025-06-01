// /app/api/friends/[friendId]/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/utils/dbConnect";
import User from "@/models/User";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function DELETE(request, { params }) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const currentUserId = session.user.id;
  const { friendId } = params;

  if (!friendId) {
    return NextResponse.json({ error: "Missing friend ID" }, { status: 400 });
  }

  try {
    const friendUser = await User.findById(friendId);
    if (!friendUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Scoatem friendId din friends-ul userului curent
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { friends: friendId }
    });

    // Scoatem currentUserId din friends-ul prietenului
    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: currentUserId }
    });

    return NextResponse.json({ message: "Prieten șters cu succes." }, { status: 200 });
  } catch (err) {
    console.error("Error deleting friend:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
