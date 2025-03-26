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
        // Returnăm un obiect utilizator cu câmpurile necesare pentru sesiune
        return { id: user._id.toString(), name: user.username, email: user.email };
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
      // La fiecare autentificare nouă (user există), sincronizăm cu DB-ul
      if (user) {
        await dbConnect();
        if (account?.provider === "google") {
          // Autentificare prin Google
          let existingUser = await User.findOne({ email: user.email });
          if (!existingUser) {
            // Creează un utilizator nou dacă nu există unul cu acest email
            const randomPassword = Math.random().toString(36).slice(-8); // parole random generată
            const hashedPassword = await bcrypt.hash(randomPassword, 10);
            existingUser = await User.create({
              username: user.name || user.email,
              email: user.email,
              password: hashedPassword,
            });
          }
          // Atașează informațiile utilizatorului din baza de date la token
          token.id = existingUser._id.toString();
          token.name = existingUser.username;
          token.email = existingUser.email;
        } else if (account?.provider === "credentials") {
          // Autentificare cu credențiale (user provine deja din baza de date)
          token.id = user.id;
          token.name = user.name;
          token.email = user.email;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Atașează datele relevante la sesiunea de client
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
