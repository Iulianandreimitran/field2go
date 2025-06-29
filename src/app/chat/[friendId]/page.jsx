// === app/chat/[friendId]/page.jsx ===
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/utils/dbConnect";
import Message from "@/models/Message";
import ChatBoxFriends from "@/components/ChatBoxFriends";

export default async function ChatFriendPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return <div className="text-white">Trebuie să fii autentificat.</div>;

  const userId = session.user.id;
  const friendId = params.friendId;
  const roomId = [userId, friendId].sort().join('_');

  await dbConnect();
  const messages = await Message.find({
    $or: [
      { sender: userId, receiver: friendId },
      { sender: friendId, receiver: userId },
    ]
  })
    .sort({ createdAt: 1 })
    .populate('sender', 'username email') 
    .lean();

  const initialMessages = messages.map(msg => ({
    text: msg.content,
    sender: msg.sender.username || msg.sender.email || msg.sender._id,
    timestamp: msg.createdAt
  }));


  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-4">Chat cu prietenul</h1>
      <ChatBoxFriends roomId={roomId} friendId={friendId} initialMessages={initialMessages} />
    </div>
  );
}
