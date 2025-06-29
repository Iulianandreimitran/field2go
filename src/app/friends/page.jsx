// /app/friends/page.jsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/utils/dbConnect";
import User from "@/models/User";
import FriendList from "@/components/FriendList";

export default async function FriendsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <p>Trebuie să fii autentificat pentru a vedea lista de prieteni.</p>
      </div>
    );
  }
  const currentUserId = session.user.id;

  await dbConnect();

  const currentUser = await User.findById(currentUserId)
    .populate("friends", "username avatar")
    .lean(); 

  const rawFriends = currentUser?.friends || [];

  const friends = rawFriends.map((f) => ({
    _id: f._id.toString(),
    username: f.username,
    avatar: f.avatar || "", 
  }));

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <h1 className="text-3xl font-bold text-white mb-6">Prietenii mei</h1>
      <FriendList initialFriends={friends} />
    </div>
  );
}
