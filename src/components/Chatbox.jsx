// src/components/ChatBox.jsxAdd commentMore actions
'use client';
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useSession } from 'next-auth/react';

export default function ChatBox({ reservationId, initialMessages = [] }) {
  const { data: session } = useSession();
  // Formatează mesajele inițiale pentru a avea numele expeditorului ca text
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
    // Conectează la serverul Socket.IO (folosește origin-ul curent)
    const socket = io('http://localhost:3001', { transports: ['websocket'] });
    socketRef.current = socket;
    // Alătură "camera" specifică rezervării pentru a primi mesaje
    socket.emit('joinReservation', reservationId);
    // Primește mesaje de la server și actualizează lista
    socket.on('message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    // Cleanup la demontare: deconectează socket-ul
    return () => {
      socket.disconnect();
    };
  }, [session, reservationId]);

  useEffect(() => {
    // Derulează automat la ultimul mesaj când lista de mesaje se schimbă
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
    // Trimite mesajul către server
    socketRef.current.emit('reservationMessage', msgData);
    // Golește câmpul de input după trimitere (mesajul va apărea prin evenimentul de la server)
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
              <span className="ml-2">{msg.text}</span>
              {timeStr && (
                <div className="text-xs text-gray-400">{timeStr}</div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />  {/* element invizibil pentru scroll */}
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