
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/utils/dbConnect";
import Reservation from "@/models/Reservation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


export async function GET(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);

  const fieldId   = searchParams.get("field");              
  const date      = searchParams.get("date");                
  const isPublic  = searchParams.get("public") === "true";  
  const isMine    = searchParams.get("mine")   === "true";   
  const isInvited = searchParams.get("invited")=== "true";   


  if (fieldId && date) {
    const reservations = await Reservation.find({
      field: fieldId,
      date:  date
    }).lean();
    return NextResponse.json(reservations);
  }

  if (isPublic) {
    const reservations = await Reservation.find({
      isPublic: true,
      status:   "active"
    })
      .populate("field", "name")
      .populate("owner", "username email")
      .populate("participants", "username email")
      .lean();

    return NextResponse.json(reservations);
  }

  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const currentUserId = session.user.id;

  let filter = {};

  if (isMine) {
    filter = {
      $or: [
        { owner: currentUserId },
        { participants: currentUserId }
      ],
      status: { $in: ["pending", "active"] }
    };
  } else if (isInvited) {
    filter = {
      invites: currentUserId,
      status: { $in: ["pending", "active"] }
    };
  } else {
    filter = {
      $or: [
        { owner: currentUserId },
        { participants: currentUserId }
      ],
      status: "active"
    };
  }


  const reservations = await Reservation.find(filter)
    .populate("field", "name")
    .populate("owner", "username email")
    .populate("participants", "username email")
    .populate("invites", "username email")
    .lean();

  return NextResponse.json(reservations);
}


export async function POST(req) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const currentUserId = session.user.id;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { fieldId, reservedDate, startTime, duration } = body;
  if (!fieldId || !reservedDate || !startTime || !duration) {
    return NextResponse.json(
      { error: "Lipsesc datele necesare rezervării." },
      { status: 400 }
    );
  }

  try {
    const newReservation = await Reservation.create({
      field:        fieldId,                         
      owner:        currentUserId,                  
      date:         reservedDate,                    
      startTime:    startTime,                       
      duration:     parseInt(duration, 10),        
      isPublic:     false,                       
      status:       "pending",                    
      participants: [],                          
      invites:      [],                         
      messages:     []                           
    });

    return NextResponse.json({ reservation: newReservation }, { status: 201 });
  } catch (err) {
    console.error("Reservation creation error:", err);
    return NextResponse.json(
      { error: "Eroare la crearea rezervării." },
      { status: 500 }
    );
  }
}
