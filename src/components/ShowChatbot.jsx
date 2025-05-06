// src/app/components/ShowChatbot.jsx
"use client";
import { useSession } from "next-auth/react";
import ChatbotWidget from "@/components/ChatbotWidget";

export default function ShowChatbot() {
  const { status } = useSession();
  if (status !== "authenticated") return null;
  return <ChatbotWidget />;
}
