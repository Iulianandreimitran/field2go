// src/models/Reservation.js
// Schema Mongoose pentru rezervări (asociază un teren și un utilizator cu un interval orar)
import mongoose from "mongoose";

const ReservationSchema = new mongoose.Schema({
  field: { type: mongoose.Schema.Types.ObjectId, ref: "Field", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reservedDate: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
}, { timestamps: true });

export default mongoose.models.Reservation || mongoose.model("Reservation", ReservationSchema);
