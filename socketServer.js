require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');

const reservationModule = require('./src/models/Reservation.js');
const messageModule = require('./src/models/Message.js');

const Reservation = reservationModule.default || reservationModule;
const Message = messageModule.default || messageModule;

if (!process.env.MONGODB_URI) {
  console.error("❌ EROARE: MONGODB_URI nu este definită!");
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("📦 MongoDB conectat (Socket server)."))
.catch(err => {
  console.error("❌ Eroare MongoDB:", err);
  process.exit(1);
});

const httpServer = http.createServer();
const io = new Server(httpServer, {
  cors: { origin: 'http://localhost:3000', methods: ['GET','POST'] }
});

io.on('connection', socket => {
  console.log("🟢 Socket conectat:", socket.id);

  // === Chat Rezervări ===
  socket.on('joinReservation', (reservationId) => {
    socket.join(reservationId);
    console.log(`Socket ${socket.id} joined reservation ${reservationId}`);
  });

  socket.on('reservationMessage', async ({ reservationId, text, senderId, senderName }) => {
    const timestamp = new Date();
    try {
      await Reservation.findByIdAndUpdate(reservationId, {
        $push: { messages: { sender: senderId, text, timestamp } }
      });
      io.to(reservationId).emit('message', { sender: senderName, text, timestamp });
    } catch (err) {
      console.error('❌ Eroare la salvarea mesajului în rezervare:', err);
    }
  });

  // === Chat Prieteni ===
  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on('message', async ({ roomId, text, senderId, senderName, mode }) => {
    if (!roomId || !mode) return;
    const timestamp = new Date();

    try {
      if (mode === 'private') {
        const [u1, u2] = roomId.split('_');
        const receiverId = senderId === u1 ? u2 : u1;
        await Message.create({ sender: senderId, receiver: receiverId, content: text, createdAt: timestamp });
        io.to(roomId).emit('message', { sender: senderName, text, timestamp });
      }
    } catch (err) {
      console.error('❌ Eroare la salvarea mesajului privat:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log("🔴 Socket deconectat:", socket.id);
  });
});

const PORT = process.env.SOCKET_PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Socket server rulează pe http://localhost:${PORT}`);
});
