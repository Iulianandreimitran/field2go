// src/models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" } // "user" sau "admin"
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
