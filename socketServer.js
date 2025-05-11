// socketServer.js
require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');
const http    = require('http');
const { Server } = require('socket.io');

// 1) Importăm modelul corect din ES-Module
const reservationModule = require('./src/models/Reservation.js');
const Reservation = reservationModule.default || reservationModule;

if (!process.env.MONGODB_URI) {
  console.error("EROARE: MONGODB_URI nu este definită!");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGODB_URI, {
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
  console.log("🟢 Client Socket conectat:", socket.id);

  socket.on('joinReservation', id => socket.join(id));

  socket.on('message', async ({ reservationId, text, senderId, senderName }) => {
    if (!reservationId) return;
    try {
      // Acum Reservation.findByIdAndUpdate există
      await Reservation.findByIdAndUpdate(reservationId, {
        $push: { messages: { sender: senderId, text, timestamp: new Date() } }
      });
      io.to(reservationId).emit('message', {
        sender: senderName,
        text,
        timestamp: new Date()
      });
    } catch (err) {
      console.error('❌ Eroare la salvarea mesajului:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log("🔴 Client Socket deconectat:", socket.id);
  });
});

const PORT = process.env.SOCKET_PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Socket server rulează pe http://localhost:${PORT}`);
});
