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
        // Returnăm obiectul utilizatorului, inclusiv rolul, pentru a fi salvat în token
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
      // Dacă utilizatorul tocmai s-a logat (prima intrare în sistem)
      if (user && account) {
        if (account.provider === "google") {
          // Autentificare prin Google – asigurăm existența utilizatorului în baza de date
          await dbConnect();
          // Căutăm utilizatorul după email (dacă există deja un cont local cu acest email)
          let dbUser = await User.findOne({ email: user.email });
          if (!dbUser) {
            // Dacă nu există, creăm un nou utilizator în DB cu rol "user"
            const hashedPassword = await bcrypt.hash(user.email + process.env.NEXTAUTH_SECRET, 10);
            dbUser = await User.create({
              email: user.email,
              username: user.name || user.email,
              password: hashedPassword,  // parolă random hash-uită, deoarece autentificarea se face prin Google
              role: "user",
            });
          }
          // Sincronizăm token-ul JWT NextAuth cu ID-ul și rolul din baza de date
          token.id = dbUser._id.toString();
          token.role = dbUser.role;
          token.name = user.name;
          token.email = user.email;
        } else if (account.provider === "credentials") {
          // Autentificare cu credențiale (email/parolă) prin NextAuth
          token.id = user.id;
          token.role = user.role || "user";
          token.name = user.name;
          token.email = user.email;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Atașează ID-ul și rolul utilizatorului la sesiune (accesibil pe client)
      session.user.id = token.id;
      session.user.name = token.name;
      session.user.email = token.email;
      session.user.role = token.role || "user";
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
