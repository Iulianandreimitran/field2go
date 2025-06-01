// models/FriendRequest.js
import mongoose from "mongoose";

const FriendRequestSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: {
    type: String,
    enum: ["pending", "accepted", "declined"],
    default: "pending"
  }
}, { timestamps: true });

// Reutilizare model dacă există (previne eroarea OverwriteModelError)
export default mongoose.models.FriendRequest || mongoose.model("FriendRequest", FriendRequestSchema);
