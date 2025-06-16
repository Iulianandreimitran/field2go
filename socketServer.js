require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

// Modele
const Reservation = require('./src/models/Reservation').default || require('./src/models/Reservation');
const Message = require('./src/models/Message').default || require('./src/models/Message');

// Conectare MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("📦 MongoDB conectat."))
  .catch(err => {
    console.error("❌ Eroare MongoDB:", err);
    process.exit(1);
  });

// Setup server HTTP și Socket.IO
const httpServer = http.createServer();
const io = new Server(httpServer, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] }
});

// Exportăm instanța pentru a putea emite din route-uri
global._socketServerInstance = io;

// Funcție utilitară pentru emitere mesaj
const emitToReservation = (reservationId, event, payload) => {
  if (reservationId) {
    io.to(reservationId).emit(event, payload);
  }
};

const emitToUser = (userId, event, payload) => {
  if (userId) {
    io.to(userId).emit(event, payload);
  }
};

// Socket logic
io.on('connection', socket => {
  console.log("🟢 Socket conectat:", socket.id);

  // === REZERVĂRI ===
  socket.on('joinReservation', (reservationId) => {
    socket.join(reservationId);
    console.log(`🔗 Socket ${socket.id} joined rezervare ${reservationId}`);
  });

  socket.on('reservationMessage', async ({ reservationId, text, senderId, senderName }) => {
    const timestamp = new Date();
    try {
      await Reservation.findByIdAndUpdate(reservationId, {
        $push: { messages: { sender: senderId, text, timestamp } }
      });
      emitToReservation(reservationId, 'message', { sender: senderName, text, timestamp });
    } catch (err) {
      console.error("❌ Eroare salvare mesaj rezervare:", err);
    }
  });

  socket.on('reservation:trigger-update', (reservationId) => {
    emitToReservation(reservationId, 'reservation:update');
  });

  // === PRIETENI ===
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`💬 Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on('message', async ({ roomId, text, senderId, senderName, mode }) => {
    const timestamp = new Date();
    if (mode !== 'private') return;

    const [u1, u2] = roomId.split('_');
    const receiverId = senderId === u1 ? u2 : u1;

    try {
      await Message.create({ sender: senderId, receiver: receiverId, content: text, createdAt: timestamp });
      io.to(roomId).emit('message', { sender: senderName, text, timestamp });
    } catch (err) {
      console.error("❌ Eroare mesaj privat:", err);
    }
  });

  // === INVITAȚII USER ===
  socket.on('joinUserRoom', (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`👤 Socket ${socket.id} joined user room ${userId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log("🔴 Socket deconectat:", socket.id);
  });
});

// Port implicit 3001 dacă nu e definit în .env.local
const PORT = process.env.SOCKET_PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Socket server rulează pe http://localhost:${PORT}`);
});
