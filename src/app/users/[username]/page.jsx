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
  // Așteptăm `params` înainte de a-l despacheta:
  const { username } = await params;  

  // 1. Conectăm la MongoDB
  await dbConnect();

  // 2. Căutăm documentul User după câmpul username
  const user = await User.findOne({ username: username });
  if (!user) {
    return <div className="p-4 text-white bg-gray-900">Utilizatorul nu a fost găsit.</div>;
  }

  // 3. Luăm rezervările publice ale acestui utilizator
  const publicReservations = await Reservation.find({
    user: user._id,
    isPublic: true,
  }).lean();

  // 4. Determinăm starea butonului de prietenie
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

  // 5. Rândăm pagina
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-md mx-auto bg-gray-800 rounded-lg p-6 shadow">
        <h1 className="text-2xl font-bold mb-4">{user.username}</h1>
        {user.avatar ? (
          <Image
            src={user.avatar}
            alt="Avatar"
            width={120}
            height={120}
            className="rounded-full mb-4"
          />
        ) : (
          <div className="w-24 h-24 bg-gray-700 rounded-full mb-4" />
        )}
        <p className="mb-4">{user.bio || "Nicio descriere."}</p>

        {showRequestButton && (
          <FriendRequestButton targetUserId={user._id.toString()} />
        )}
        {requestAlreadySent && (
          <div className="px-3 py-2 bg-yellow-600 text-gray-900 rounded mb-4">
            Cerere de prietenie trimisă.
          </div>
        )}
        {isFriend && (
          <div className="px-3 py-2 bg-green-600 text-gray-900 rounded mb-4">
            Sunteți prieteni.
          </div>
        )}

        <h2 className="text-xl font-semibold mt-6 mb-2">Rezervări Publice</h2>
        {publicReservations.length === 0 ? (
          <p>Nu are rezervări publice.</p>
        ) : (
          <ul className="space-y-2">
            {publicReservations.map((res) => (
              <li
                key={res._id}
                className="bg-gray-700 p-3 rounded hover:bg-gray-600 transition"
              >
                <strong>{res.title || "Fără titlu"}</strong>
                <br />
                {new Date(res.date).toLocaleDateString("ro-RO", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                })}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
