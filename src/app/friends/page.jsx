// /app/friends/page.jsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/utils/dbConnect";
import User from "@/models/User";
import FriendList from "@/components/FriendList";

export default async function FriendsPage() {
  // 1. Obținem sesiunea
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <p>Trebuie să fii autentificat pentru a vedea lista de prieteni.</p>
      </div>
    );
  }
  const currentUserId = session.user.id;

  // 2. Conectăm la baza de date
  await dbConnect();

  // 3. Preluăm utilizatorul curent și populăm câmpul `friends`
  const currentUser = await User.findById(currentUserId)
    .populate("friends", "username avatar")
    .lean(); // lean() transformă într-un plain object

  // Dacă nu există câmpul friends (ex: user nou), punem array gol
  const rawFriends = currentUser?.friends || [];

  // 4. Convertim fiecare friend într-un plain object cu _id ca string
  const friends = rawFriends.map((f) => ({
    _id: f._id.toString(),
    username: f.username,
    avatar: f.avatar || "", // poți lăsa string gol dacă nu are avatar
  }));

  // 5. Trimitem acest array de plain objects către Client Component
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <h1 className="text-3xl font-bold text-white mb-6">Prietenii mei</h1>
      <FriendList initialFriends={friends} />
    </div>
  );
}
