require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');


const Reservation = require('./src/models/Reservation').default || require('./src/models/Reservation');
const Message = require('./src/models/Message').default || require('./src/models/Message');


mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("📦 MongoDB conectat."))
  .catch(err => {
    console.error("❌ Eroare MongoDB:", err);
    process.exit(1);
  });


const app = express();
app.use(express.json()); 

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] }
});


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


app.post('/emit-friend-request', (req, res) => {
  const { receiverId, request } = req.body;

  if (!receiverId || !request) {
    return res.status(400).json({ error: 'receiverId și request sunt necesare' });
  }

  io.to(receiverId).emit("friend-request:new", { request });
  console.log(`✅ Notificare cerere de prietenie trimisă către ${receiverId}`);

  res.sendStatus(200);
});

app.post('/emit-invite', (req, res) => {
  const { receiverId } = req.body;
  if (!receiverId) return res.status(400).json({ error: 'receiverId lipsă' });

  io.to(receiverId).emit("invite:new");
  console.log(`📣 invite:new trimis către ${receiverId}`);
  res.sendStatus(200);
});


io.on('connection', socket => {
  console.log("🟢 Socket conectat:", socket.id);

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
      

      io.to(roomId).emit('message', { 
        senderId,    
        sender: senderName, 
        text, 
        timestamp 
      });
    } catch (err) {
      console.error("❌ Eroare mesaj privat:", err);
    }
  });

  socket.on('joinUserRoom', (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`👤 Socket ${socket.id} joined user room ${userId}`);
    } else {
      console.warn("⚠️ userId lipsă la joinUserRoom");
    }
  });

  socket.on('disconnect', () => {
    console.log("🔴 Socket deconectat:", socket.id);
  });

  socket.on("profile:update", ({ userId, newName }) => {
    emitToUser(userId, "profile:update", { newName });
    console.log(`👤 Actualizare nume trimisă către user ${userId}`);
  });

});



const PORT = process.env.SOCKET_PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Socket server rulează pe http://localhost:${PORT}`);
});

