// src/models/Reservation.js
import mongoose from 'mongoose';

const ReservationSchema = new mongoose.Schema({
  field: { type: mongoose.Schema.Types.ObjectId, ref: 'Field', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },    // ex: "14:00"
  duration: { type: Number, required: true },      // durata în ore
  isPublic: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'active', 'completed'], default: 'pending' },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],  // utilizatori care participă (acceptați)
  invites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],       // utilizatori invitați (în așteptare)
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default mongoose.models.Reservation || mongoose.model('Reservation', ReservationSchema);
