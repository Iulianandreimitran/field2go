import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import dbConnect from "@/utils/dbConnect";
import FriendRequest from "@/models/FriendRequest";

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
    // Only the receiver can reject/decline the request
    if (friendRequest.receiver.toString() !== userId) {
      return NextResponse.json({ error: "Nu ești autorizat să respingi această cerere de prietenie." }, { status: 403 });
    }

    const senderId = friendRequest.sender.toString();
    const receiverId = friendRequest.receiver.toString();

    // Remove this friend request and any opposite request (if it exists)
    await FriendRequest.deleteMany({
      $or: [
        { _id: requestId },
        { sender: receiverId, receiver: senderId }
      ]
    });

    return NextResponse.json({ message: "Cererea de prietenie a fost respinsă." }, { status: 200 });
  } catch (err) {
    console.error("Error rejecting friend request:", err);
    if (err.name === "CastError") {
      return NextResponse.json({ error: "ID-ul cererii de prietenie este invalid." }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
