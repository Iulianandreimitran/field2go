// src/app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "../../../../utils/dbConnect";
import User from "../../../../models/User";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Parolă", type: "password" },
      },
      async authorize(credentials) {
        await dbConnect();
        const user = await User.findOne({ email: credentials.email });
        if (!user) {
          throw new Error("Email sau parolă incorecte.");
        }
        const isMatch = await bcrypt.compare(credentials.password, user.password);
        if (!isMatch) {
          throw new Error("Email sau parolă incorecte.");
        }
        return { id: user._id.toString(), name: user.username, email: user.email, role: user.role };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" }, 
  callbacks: {
    async jwt({ token, user, account }) {
      if (user && account) {
        if (account.provider === "google") {
          await dbConnect();
          let dbUser = await User.findOne({ email: user.email });
          if (!dbUser) {
            const randomPassword = user.email + process.env.NEXTAUTH_SECRET; 
            const hashedPassword = await bcrypt.hash(randomPassword, 10);
            dbUser = await User.create({
              email: user.email,
              username: user.name || user.email,
              password: hashedPassword,
              role: "user",
            });
          }
          token.id = dbUser._id.toString();
          token.role = dbUser.role;
          token.name = dbUser.username || dbUser.name;
          token.email = dbUser.email;
          token.bio = dbUser.bio || "";
          token.image = dbUser.avatar || "";
        } else if (account.provider === "credentials") {
          token.id = user.id;
          token.role = user.role || "user";
          token.name = user.name;
          token.email = user.email;
          token.bio = user.bio;
          token.image = user.avatar
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.name = token.name;
      session.user.email = token.email;
      session.user.role = token.role || "user";
      session.user.bio = token.bio || "";
      session.user.image = token.image || "";
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
