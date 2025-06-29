import { NextResponse } from "next/server";
import dbConnect from "../../../utils/dbConnect";
import User from "../../../models/User";
import Field from "../../../models/Field"; 
import bcrypt from "bcryptjs";

export async function GET() {
  await dbConnect();

  const email = "admin@example.com";
  const password = "parola_admin";

  try {
    let adminUser = await User.findOne({ email });

    if (adminUser) {
      adminUser.role = "admin";
      await adminUser.save();
    } else {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      adminUser = new User({
        username: "Admin",
        email: email,
        password: hashedPassword,
        role: "admin",
      });
      await adminUser.save();
    }

    const updateResult = await Field.updateMany(
      { owner: { $exists: false } },
      { $set: { owner: adminUser._id } }
    );

    return NextResponse.json({
      msg: `Contul admin este pregătit. ${updateResult.modifiedCount} teren(uri) actualizat(e).`,
    }, { status: 200 });

  } catch (error) {
    console.error("Eroare la seed admin:", error);
    return NextResponse.json(
      { msg: "Eroare la crearea contului admin.", error: error.message },
      { status: 500 }
    );
  }
}
