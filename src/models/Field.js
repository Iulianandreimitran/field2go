// src/models/Field.js
import mongoose from "mongoose";

const FieldSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  sportType: { type: String, required: true },
  pricePerHour: { type: Number, required: true },
  description: { type: String },
  images: { type: [String], default: [] },
}, { timestamps: true });

export default mongoose.models.Field || mongoose.model("Field", FieldSchema);
