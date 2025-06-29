import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import dbConnect from "@/utils/dbConnect";
import FriendRequest from "@/models/FriendRequest";
import User from "@/models/User";

export async function POST(request, { params }) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requestId } = params;
  if (!requestId) {
    return NextResponse.json({ error: "Friend request ID is required." }, { status: 400 });
  }

  try {
    const friendRequest = await FriendRequest.findById(requestId);
    if (!friendRequest) {
      return NextResponse.json({ error: "Cererea de prietenie nu a fost găsită (poate a fost deja procesată)." }, { status: 404 });
    }

    const userId = session.user.id;
    if (friendRequest.receiver.toString() !== userId) {
      return NextResponse.json({ error: "Nu ești autorizat să accepți această cerere de prietenie." }, { status: 403 });
    }

    const senderId = friendRequest.sender.toString();
    const receiverId = friendRequest.receiver.toString(); 
    await User.updateOne(
      { _id: senderId },
      { $addToSet: { friends: receiverId } }
    );
    await User.updateOne(
      { _id: receiverId },
      { $addToSet: { friends: senderId } }
    );

    await FriendRequest.deleteMany({
      $or: [
        { _id: requestId },
        { sender: receiverId, receiver: senderId }
      ]
    });

    return NextResponse.json({ message: "Cererea de prietenie a fost acceptată cu succes." }, { status: 200 });
  } catch (err) {
    console.error("Error accepting friend request:", err);
    if (err.name === "CastError") {
      return NextResponse.json({ error: "ID-ul cererii de prietenie este invalid." }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
