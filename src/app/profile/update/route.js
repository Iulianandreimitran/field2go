import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import dbConnect from "../../../utils/dbConnect";
import User from "../../../models/User";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

// Debifează bodyParser și permite multipart upload
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function PATCH(request) {
  await dbConnect();

  // autentificare NextAuth
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // extragem FormData
  const formData = await request.formData();
  const username = formData.get("username");
  const email = formData.get("email");
  const bio = formData.get("bio");
  const currentPassword = formData.get("currentPassword");
  const newPassword = formData.get("newPassword");
  const avatarFile = formData.get("avatar");

  if (!username || !email) {
    return NextResponse.json({ error: "Username și email obligatorii" }, { status: 400 });
  }

  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // schimbare parolă
  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Parola actuală este necesară." }, { status: 400 });
    }
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return NextResponse.json({ error: "Parola actuală e incorectă." }, { status: 400 });
    }
    user.password = await bcrypt.hash(newPassword, 10);
  }

  // proces avatar
  if (avatarFile && avatarFile.size) {
    const buffer = Buffer.from(await avatarFile.arrayBuffer());
    const fileName = `${Date.now()}-${avatarFile.name}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    await fs.promises.writeFile(path.join(uploadDir, fileName), buffer);
    user.avatar = `/uploads/${fileName}`;
  }

  // actualizează câmpuri
  user.username = username;
  user.email = email;
  user.bio = bio;

  await user.save();

  return NextResponse.json({
    message: "Profil actualizat!",
    user: {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      bio: user.bio,
      avatar: user.avatar,
    },
  });
}
