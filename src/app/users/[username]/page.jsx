// app/users/[username]/page.jsx
import Image from "next/image";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/utils/dbConnect";
import User from "@/models/User";
import Reservation from "@/models/Reservation";
import FriendRequest from "@/models/FriendRequest";
import FriendRequestButton from "@/components/FriendRequestButton";

export default async function UserProfilePage({ params }) {
  const { username } = await params;  

  await dbConnect();

  const user = await User.findOne({ username: username });
  if (!user) {
    return <div className="p-4 text-white bg-gray-900">Utilizatorul nu a fost găsit.</div>;
  }

  const publicReservations = await Reservation.find({
    user: user._id,
    isPublic: true,
  }).lean();

  const session = await getServerSession(authOptions);
  let showRequestButton = false;
  let requestAlreadySent = false;
  let isFriend = false;

  if (session) {
    const currentUser = await User.findOne({ email: session.user.email });
    if (currentUser && currentUser._id.toString() !== user._id.toString()) {
      const existing = await FriendRequest.findOne({
        $or: [
          { sender: currentUser._id, receiver: user._id },
          { sender: user._id, receiver: currentUser._id },
        ],
      });
      if (!existing) {
        showRequestButton = true;
      } else {
        if (
          existing.sender.toString() === currentUser._id.toString() &&
          existing.status === "pending"
        ) {
          requestAlreadySent = true;
        }
        if (existing.status === "accepted") {
          isFriend = true;
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-lg mx-auto bg-gray-800 rounded-2xl shadow-xl p-6">
        <div className="flex flex-col items-center">
          {user.avatar ? (
            <Image
              src={user.avatar}
              alt="Avatar"
              width={100}
              height={100}
              className="rounded-full mb-4 object-cover border-4 border-purple-500"
            />
          ) : (
            <div className="w-24 h-24 bg-gray-700 rounded-full mb-4" />
          )}
          <h1 className="text-2xl font-bold mb-1">{user.username}</h1>
          <p className="text-gray-300 mb-4">
            {user.bio || "Nicio descriere."}
          </p>

          {showRequestButton && (
            <FriendRequestButton targetUserId={user._id.toString()} />
          )}
          {requestAlreadySent && (
            <div className="px-3 py-2 bg-yellow-500 text-black rounded mb-3 font-medium">
              Cerere de prietenie trimisă
            </div>
          )}
          {isFriend && (
            <div className="px-3 py-2 bg-green-500 text-black rounded mb-3 font-medium">
              Sunteți prieteni
            </div>
          )}
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-3 border-b border-gray-700 pb-1">
            Rezervări Publice
          </h2>
          {publicReservations.length === 0 ? (
            <p className="text-gray-400">Nu are rezervări publice.</p>
          ) : (
            <ul className="space-y-2">
              {publicReservations.map((res) => (
                <li
                  key={res._id}
                  className="bg-gray-700 px-4 py-3 rounded-lg hover:bg-gray-600 transition"
                >
                  <p className="font-semibold text-purple-400">
                    {res.title || "Fără titlu"}
                  </p>
                  <p className="text-sm text-gray-300">
                    {new Date(res.date).toLocaleDateString("ro-RO", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );

}
