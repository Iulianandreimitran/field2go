import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import dbConnect from "@/utils/dbConnect";
import FriendRequest from "@/models/FriendRequest";
import User from "@/models/User";

export async function POST(request) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session) {

    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { receiver } = await request.json();
    const senderId = session.user.id;
    const receiverId = receiver;


    if (!receiverId) {
      return NextResponse.json({ error: "Missing receiver user ID." }, { status: 400 });
    }
    if (senderId === receiverId) {
      return NextResponse.json({ error: "Nu poți trimite o cerere de prietenie către tine însuți." }, { status: 400 });
    }


    const receiverUser = await User.findById(receiverId);
    if (!receiverUser) {
      return NextResponse.json({ error: "Utilizatorul țintă nu există." }, { status: 404 });
    }


    const existingReq = await FriendRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ]
    });
    if (existingReq) {
      return NextResponse.json({ error: "O cerere de prietenie între acești utilizatori există deja." }, { status: 409 });
    }


    const currentUser = await User.findById(senderId);
    if (currentUser?.friends?.includes(receiverId)) {
      return NextResponse.json({ error: "Sunteți deja prieteni cu acest utilizator." }, { status: 409 });
    }

 
    const friendRequest = await FriendRequest.create({
      sender: senderId,
      receiver: receiverId
    });
    
    await friendRequest.populate([
      { path: "sender", select: "username name email avatar" },
      { path: "receiver", select: "username name email avatar" }
    ]);

    await fetch(`http://localhost:3001/emit-friend-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiverId,
        request: friendRequest
      })
    });



    return NextResponse.json({ friendRequest }, { status: 201 });
  } catch (err) {
    console.error("Error creating friend request:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    const receivedRequests = await FriendRequest.find({ receiver: userId })
      .populate("sender", "username name email avatar")
      .lean();

    const sentRequests = await FriendRequest.find({ sender: userId })
      .populate("receiver", "username name email avatar")
      .lean();

    return NextResponse.json(
      { received: receivedRequests, sent: sentRequests },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching friend requests:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
