'use client';

import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useSession } from 'next-auth/react';

export default function ChatBox({ roomId, mode = "private", initialMessages = [] }) {
  const { data: session } = useSession();
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const initialFormatted = initialMessages.map(msg => {
    const senderName = typeof msg.sender === 'object'
      ? (msg.sender.username || msg.sender.name || msg.sender.email || 'User')
      : msg.sender;
    return {
      sender: senderName,
      text: msg.text || msg.content,
      timestamp: msg.timestamp || msg.createdAt
    };
  });

  const [messages, setMessages] = useState(initialFormatted);
  const [newMsg, setNewMsg] = useState('');

  useEffect(() => {
    if (!session?.user || !roomId) return;

    const socket = io('http://localhost:3001', {
      transports: ['websocket'],
      autoConnect: true,
    });
    socketRef.current = socket;

    // 🔌 JOIN CAMERA
    if (mode === "reservation") {
      socket.emit("joinReservation", roomId);
    } else {
      const friendId = roomId.split('_').find(id => id !== session.user.id);
      socket.emit("joinPrivateRoom", { userId: session.user.id, friendId });
    }

    // 📥 RECEPȚIE MESAJ
    const eventName = mode === "reservation" ? "message" : "privateMessage";
    socket.on(eventName, (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // 🔌 Cleanup
    return () => {
      socket.disconnect();
    };
  }, [roomId, session?.user?.id, mode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMsg.trim() || !socketRef.current || !session?.user) return;

    if (mode === "reservation") {
      const msgData = {
        reservationId: roomId,
        text: newMsg.trim(),
        senderId: session.user.id,
        senderName: session.user.username || session.user.name || session.user.email || 'Anon',
      };
      socketRef.current.emit("message", msgData);
    } else {
      const friendId = roomId.split('_').find(id => id !== session.user.id);
      const msgData = {
        senderId: session.user.id,
        receiverId: friendId,
        content: newMsg.trim(),
      };
      socketRef.current.emit("privateMessage", msgData);
    }

    setNewMsg('');
  };

  return (
    <div className="border border-gray-700 rounded-lg p-4">
      <div className="mb-3 overflow-y-auto bg-gray-800 p-3 rounded h-60">
        {messages.map((msg, idx) => {
          const timeStr = msg.timestamp ? new Date(msg.timestamp).toLocaleString() : '';
          return (
            <div key={idx} className="mb-2">
              <span className="font-semibold">{msg.sender}:</span>
              <span className="ml-2">{msg.text || msg.content}</span>
              {timeStr && <div className="text-xs text-gray-400">{timeStr}</div>}
            </div>
          );
        })}
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
