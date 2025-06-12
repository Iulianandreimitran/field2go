// === components/ChatBoxFriends.jsx ===
'use client';

import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useSession } from 'next-auth/react';

export default function ChatBoxFriends({ roomId, friendId, initialMessages = [] }) {
  const { data: session } = useSession();
  const [messages, setMessages] = useState(initialMessages);
  const [newMsg, setNewMsg] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!session?.user || !roomId) return;

    const socket = io('http://localhost:3001', {
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.emit('joinRoom', roomId);

    socket.on('message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId, session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMsg.trim() || !socketRef.current || !session?.user) return;

    const msgData = {
      roomId,
      text: newMsg.trim(),
      senderId: session.user.id,
      senderName: session.user.username || session.user.name || session.user.email,
      mode: 'private',
    };
    socketRef.current.emit('message', msgData);
    setNewMsg('');
  };

  return (
    <div className="border border-gray-700 rounded-lg p-4">
      <div className="mb-3 overflow-y-auto bg-gray-800 p-3 rounded h-60">
        {messages.map((msg, idx) => (
          <div key={idx} className="mb-2">
            <span className="font-semibold">{msg.sender}:</span>
            <span className="ml-2">{msg.text}</span>
            {msg.timestamp && (
              <div className="text-xs text-gray-400">{new Date(msg.timestamp).toLocaleString()}</div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex">
        <input
          type="text"
          value={newMsg}
          onChange={e => setNewMsg(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
          placeholder="Scrie un mesaj..."
          className="flex-1 mr-2 px-2 py-1 rounded bg-white text-black"
        />
        <button onClick={handleSendMessage} className="bg-blue-600 hover:bg-blue-700 px-4 py-1 rounded text-white">
          Trimite
        </button>
      </div>
    </div>
  );
}
