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
    // User must be logged in
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { receiver } = await request.json();
    const senderId = session.user.id;
    const receiverId = receiver;

    // Validate request body
    if (!receiverId) {
      return NextResponse.json({ error: "Missing receiver user ID." }, { status: 400 });
    }
    if (senderId === receiverId) {
      return NextResponse.json({ error: "Nu poți trimite o cerere de prietenie către tine însuți." }, { status: 400 });
    }

    // Ensure the receiver exists
    const receiverUser = await User.findById(receiverId);
    if (!receiverUser) {
      return NextResponse.json({ error: "Utilizatorul țintă nu există." }, { status: 404 });
    }

    // Check if a friend request already exists between these two users (in either direction)
    const existingReq = await FriendRequest.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ]
    });
    if (existingReq) {
      return NextResponse.json({ error: "O cerere de prietenie între acești utilizatori există deja." }, { status: 409 });
    }

    // (Optional) Check if they are already friends (assuming User model has a friends list)
    const currentUser = await User.findById(senderId);
    if (currentUser?.friends?.includes(receiverId)) {
      return NextResponse.json({ error: "Sunteți deja prieteni cu acest utilizator." }, { status: 409 });
    }

    // Create and save the new friend request
    const friendRequest = await FriendRequest.create({
      sender: senderId,
      receiver: receiverId
    });
    // Populate sender and receiver fields with user info for response
    await friendRequest.populate([
      { path: "sender", select: "name email" },
      { path: "receiver", select: "name email" }
    ]);

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
    // Friend requests received by the current user
    const receivedRequests = await FriendRequest.find({ receiver: userId })
      .populate("sender", "name email")
      .lean();
    // Friend requests sent by the current user
    const sentRequests = await FriendRequest.find({ sender: userId })
      .populate("receiver", "name email")
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
