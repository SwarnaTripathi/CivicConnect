const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PATCH'],
  },
});

// Make io accessible in routes via req.app.get('io')
app.set('io', io);

// ── Middleware ──────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '5mb' }));

// ── MongoDB connection ──────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/civicconnect';
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('✅  MongoDB connected'))
  .catch(err => console.error('❌  MongoDB connection error:', err.message));

// ── Routes ──────────────────────────────────────────────
const ticketRoutes = require('./routes/tickets');
const authRoutes   = require('./routes/auth');
const quorumRoutes = require('./routes/quorum');

app.use('/api/tickets', ticketRoutes);
app.use('/api/auth',    authRoutes);
app.use('/api/quorum',  quorumRoutes);

// ── Health check ────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'CivicConnect Core Gateway',
    timestamp: new Date(),
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ── Socket.IO ────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`⚡  Socket connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`🔌  Socket disconnected: ${socket.id}`));
});

// ── Start server ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀  Gateway running on port ${PORT}`));
