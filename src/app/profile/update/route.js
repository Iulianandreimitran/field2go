import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "../../../utils/dbConnect";
import User from "../../../models/User";

export async function PATCH(request) {
    await dbConnect();
    
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ msg: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "mySecret");
    } catch (err) {
      return NextResponse.json({ msg: "Invalid token" }, { status: 401 });
    }
    
    const userId = decoded.userId;
    
    let body;
    try {
      body = await request.json();
    } catch (err) {
      return NextResponse.json({ msg: "Invalid JSON" }, { status: 400 });
    }
    
    const { username, email } = body;
    if (!username || !email) {
      return NextResponse.json({ msg: "Missing parameters" }, { status: 400 });
    }
    
    try {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { username, email },
        { new: true }
      );
      if (!updatedUser) {
        return NextResponse.json({ msg: "User not found" }, { status: 404 });
      }
      return NextResponse.json(
        { msg: "Profile updated", username: updatedUser.username, email: updatedUser.email },
        { status: 200 }
      );
    } catch (error) {
      return NextResponse.json({ msg: "Server error", error: error.message }, { status: 500 });
    }
  }