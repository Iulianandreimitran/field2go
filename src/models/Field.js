import mongoose from "mongoose";

const FieldSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    sportType: { type: String, required: true },
    pricePerHour: { type: Number, required: true },
    description: { type: String },
    // Adăugăm un camp coordonate
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    availableTimeSlots: { type: [Date] },
    images: { type: [String] },
  },
  { timestamps: true }
);

export default mongoose.models.Field || mongoose.model("Field", FieldSchema);