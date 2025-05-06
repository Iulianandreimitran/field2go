// src/app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "../../../../utils/dbConnect";
import User from "../../../../models/User";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    // Provider de autentificare cu email și parolă
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Parolă", type: "password" },
      },
      async authorize(credentials) {
        await dbConnect();
        // Caută utilizatorul după email în MongoDB
        const user = await User.findOne({ email: credentials.email });
        if (!user) {
          throw new Error("Email sau parolă incorecte.");
        }
        // Verifică parola folosind bcrypt comparând cu hash-ul din DB
        const isMatch = await bcrypt.compare(credentials.password, user.password);
        if (!isMatch) {
          throw new Error("Email sau parolă incorecte.");
        }
        // Returnează obiectul utilizator (va fi inclus în JWT-ul de sesiune)
        return { id: user._id.toString(), name: user.username, email: user.email, role: user.role };
      },
    }),
    // Provider OAuth Google
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },  // pagină personalizată de login
  callbacks: {
    async jwt({ token, user, account }) {
      // Este apelat la fiecare generare/actualizare de JWT.
      // La login inițial, dacă există `user` și `account`, înseamnă că utilizatorul tocmai s-a autentificat.
      if (user && account) {
        if (account.provider === "google") {
          // Autentificare prin Google – asigurăm existența utilizatorului în baza de date
          await dbConnect();
          // Caută utilizator existent cu acest email
          let dbUser = await User.findOne({ email: user.email });
          if (!dbUser) {
            // Dacă nu există, creează un nou utilizator cu rol "user" și parolă generată
            const randomPassword = user.email + process.env.NEXTAUTH_SECRET; // parolă temporară
            const hashedPassword = await bcrypt.hash(randomPassword, 10);
            dbUser = await User.create({
              email: user.email,
              username: user.name || user.email,
              password: hashedPassword,
              role: "user",
            });
          }
          // Sincronizează token-ul JWT cu ID-ul și rolul din baza de date
          token.id = dbUser._id.toString();
          token.role = dbUser.role;
          token.name = user.name;
          token.email = user.email;
        } else if (account.provider === "credentials") {
          // Autentificare cu email/parolă – ia ID-ul și rolul din obiectul utilizator returnat de authorize
          token.id = user.id;
          token.role = user.role || "user";
          token.name = user.name;
          token.email = user.email;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Este apelat la fiecare apel către getSession / useSession.
      // Atașează ID-ul și rolul din token la obiectul de sesiune, pentru a fi disponibile pe client.
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
