// src/models/Reservation.js
import mongoose from "mongoose";

const ReservationSchema = new mongoose.Schema({
  field: { type: mongoose.Schema.Types.ObjectId, ref: "Field", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reservedDate: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },

  // câmpuri noi
  status: { type: String, default: "pending" }, // "pending", "paid", "cancelled"
  expiresAt: { type: Date }, // data la care expiră rezervarea pending
}, { timestamps: true });

export default mongoose.models.Reservation || mongoose.model("Reservation", ReservationSchema);
