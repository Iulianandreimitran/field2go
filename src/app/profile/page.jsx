"use client";

import { useUser } from "../../context/UserContext";
import { useSession } from "next-auth/react";

export default function ProfilePage() {
  const { user } = useUser();
  const { data: session } = useSession();

  const localUsername = user?.username;
  const googleName = session?.user?.name;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div>
        <h1 className="text-3xl mb-4">Profilul tău</h1>
        {googleName && <p>Autentificat prin Google ca: {googleName}</p>}
        {localUsername && <p>Autentificat local cu username: {localUsername}</p>}
        {!googleName && !localUsername && <p>Nu ești autentificat.</p>}
      </div>
    </div>
  );
}
