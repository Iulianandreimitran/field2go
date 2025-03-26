// src/utils/auth.js
import dbConnect from './dbConnect';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function loginUser(email, password) {
  // Asigură-te că conexiunea e stabilită
  await dbConnect();

  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Credențiale invalide');
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Credențiale invalide');
  }
  const payload = { userId: user._id };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  return { token, user };
}