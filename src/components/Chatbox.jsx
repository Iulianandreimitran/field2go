// src/components/ChatBox.jsxAdd commentMore actions
'use client';
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useSession } from 'next-auth/react';

export default function ChatBox({ reservationId, initialMessages = [] }) {
  const { data: session } = useSession();
  const initialFormatted = initialMessages.map(msg => {
    const senderName = typeof msg.sender === 'object'
      ? (msg.sender.username || msg.sender.name || msg.sender.email || 'User')
      : msg.sender;
    return {
      sender: senderName,
      text: msg.text,
      timestamp: msg.timestamp
    };
  });
  const [messages, setMessages] = useState(initialFormatted);
  const [newMsg, setNewMsg] = useState('');
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!session?.user || !reservationId) return;
    const socket = io('http://localhost:3001', { transports: ['websocket'] });
    socketRef.current = socket;
    socket.emit('joinReservation', reservationId);
    socket.on('message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    return () => {
      socket.disconnect();
    };
  }, [session, reservationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMsg.trim() || !socketRef.current || !session?.user) return;
    const msgData = {
      reservationId,
      text: newMsg.trim(),
      senderId: session.user.id || session.user.email || 'anon',
      senderName: session.user.username || session.user.name || session.user.email || 'Anon'
    };
    socketRef.current.emit('reservationMessage', msgData);
    setNewMsg('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="overflow-y-auto space-y-3 bg-gray-900 p-3 rounded-xl shadow-inner h-96">
        {messages.map((msg, idx) => {
          const isOwn = msg.sender === (session?.user?.username || session?.user?.email);
          const timeStr = msg.timestamp ? new Date(msg.timestamp).toLocaleString("ro-RO") : "";

          return (
            <div
              key={idx}
              className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-md text-sm break-words
                ${isOwn
                  ? "ml-auto bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-right"
                  : "mr-auto bg-gray-800 text-gray-200 text-left"}
              `}
            >
              <div className="font-semibold mb-1">{msg.sender}</div>
              <div className="whitespace-pre-line">{msg.text}</div>
              <div className="text-xs mt-1 text-gray-400">{timeStr}</div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input
          type="text"
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSendMessage();
          }}
          placeholder="Scrie un mesaj..."
          className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 border border-gray-600 focus:outline-none"
        />
        <button
          onClick={handleSendMessage}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:brightness-110 text-white font-semibold transition"
        >
          Trimite
        </button>
      </div>
    </div>
  );
}