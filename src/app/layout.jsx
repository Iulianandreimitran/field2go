// src/app/layout.jsx
import "./globals.css";
import Providers from "./providers";
import Header from "@/components/Header";
import ShowChatbot from "@/components/ShowChatbot";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]/route";

export const metadata = {
  title: 'Field2Go',
};

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="ro">
      <body>
        <Providers session={session}>
          <Header />
          <main>{children}</main>
          {/* Chatbot-ul va afișa widget-ul doar dacă user-ul este autentificat */}
          <ShowChatbot />
        </Providers>
      </body>
    </html>
  );
}
