// === /app/api/messages/route.js ===
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/utils/dbConnect";
import Message from "@/models/Message";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = session.user.id;
  const friendId = searchParams.get("userId");
  if (!friendId) {
    return new Response(JSON.stringify({ error: 'userId missing' }), { status: 400 });
  }

  await dbConnect();

  try {
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: friendId },
        { sender: friendId, receiver: userId },
      ]
    }).sort({ createdAt: 1 }).lean();

    const formatted = messages.map(msg => ({
      text: msg.content,
      sender: msg.sender.toString(),
      timestamp: msg.createdAt
    }));

    return new Response(JSON.stringify(formatted), { status: 200 });
  } catch (err) {
    console.error("❌ Eroare la GET /api/messages:", err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
