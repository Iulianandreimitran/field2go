// components/AddFriendButton.jsx
import { useState } from 'react';

export default function AddFriendButton({ targetUserId }) {
  const [requestSent, setRequestSent] = useState(false);
  const [error, setError] = useState('');

  const handleSendRequest = async () => {
    setError('');
    try {
      const res = await fetch('/api/friend-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: targetUserId })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Eroare la trimiterea cererii');
      }
      setRequestSent(true);
    } catch (err) {
      setError(err.message);
    }
  };


  if (requestSent) {
    return <button disabled>Cerere trimisă</button>;
  }

  return (
    <>
      <button onClick={handleSendRequest}>Adaugă prieten</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </>
  );
}
