// src/app/api/reservations/[id]/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/utils/dbConnect';
import Reservation from '@/models/Reservation';
import User from '@/models/User';

export async function GET(request, { params }) {
  await dbConnect();
  try {
    const reservation = await Reservation.findById(params.id)
      .populate('field', 'name')
      .populate('owner', 'username email')
      .populate('participants', 'username email')
      .populate('invites', 'username email')
      .populate('messages.sender', 'username email');
    if (!reservation) {
      return NextResponse.json({ error: 'Rezervarea nu a fost găsită.' }, { status: 404 });
    }
    // Transformă mesajele astfel încât `sender` să fie un nume de utilizator sau email
    const resObj = reservation.toObject();
    if (resObj.messages) {
      resObj.messages = resObj.messages.map(msg => ({
        sender: msg.sender 
          ? (msg.sender.username || msg.sender.email || 'User') 
          : 'User',
        text: msg.text,
        timestamp: msg.timestamp
      }));
    }
    return NextResponse.json(resObj);
  } catch (err) {
    console.error('Eroare la obținerea rezervării:', err);
    return NextResponse.json({ error: 'Eroare server la obținerea rezervării.' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  await dbConnect();
  try {
    const { isPublic } = await request.json();
    const reservation = await Reservation.findById(params.id);
    if (!reservation) {
      return NextResponse.json({ error: 'Rezervare inexistentă.' }, { status: 404 });
    }
    // (Opțional) verificați dacă utilizatorul curent este owner-ul rezervării înainte de modificare
    reservation.isPublic = !!isPublic;
    await reservation.save();
    return NextResponse.json({ success: true, isPublic: reservation.isPublic });
  } catch (err) {
    console.error('Eroare la actualizarea rezervării:', err);
    return NextResponse.json({ error: 'Eroare la actualizarea rezervării.' }, { status: 500 });
  }
}
