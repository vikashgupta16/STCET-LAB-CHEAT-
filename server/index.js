import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: '*'},
  path: '/socket.io/'
});

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Rate limiting for production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Limit requests per window
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Static client - Adjust path for Vercel serverless deployment
const publicDir = path.resolve(__dirname, '../../public');
app.use('/', express.static(publicDir));

// Env
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Mongo
let db, roomsCol;
async function initMongo() {
  if (!MONGO_URI) {
    console.warn('MONGO_URI not set; running without persistence.');
    return;
  }
  const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  db = client.db(process.env.DB_NAME || 'stcet_share');
  roomsCol = db.collection('rooms');
  await roomsCol.createIndex({ roomId: 1 }, { unique: true });
  await roomsCol.createIndex({ updatedAt: -1 }); // For room discovery
}

// OpenAI client (optional)
let openai;
if (OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: OPENAI_API_KEY });
}

// API: Get public rooms
app.get('/api/rooms', async (req, res) => {
  try {
    let rooms = [];
    
    if (roomsCol) {
      // MongoDB: Get rooms with at least 1 message, sorted by last activity
      const docs = await roomsCol.find(
        { 'messages.0': { $exists: true } },
        { 
          projection: { 
            roomId: 1, 
            messages: { $slice: -1 }, // Get last message only
            updatedAt: 1 
          } 
        }
      )
      .sort({ updatedAt: -1 })
      .limit(20)
      .toArray();
      
      rooms = docs.map(doc => ({
        roomId: doc.roomId,
        messageCount: doc.messages?.length || 0,
        lastActivity: doc.updatedAt,
        lastMessage: doc.messages?.[0]?.code?.substring(0, 100) || ''
      }));
    } else {
      // Memory: Get from memoryRooms
      rooms = Array.from(memoryRooms.values())
        .filter(room => room.messages && room.messages.length > 0)
        .map(room => ({
          roomId: room.roomId,
          messageCount: room.messages.length,
          lastActivity: room.updatedAt,
          lastMessage: room.messages[room.messages.length - 1]?.code?.substring(0, 100) || ''
        }))
        .sort((a, b) => b.lastActivity - a.lastActivity)
        .slice(0, 20);
    }
    
    res.json(rooms);
  } catch (err) {
    console.error('rooms api error', err);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// API: Delete room
app.delete('/api/rooms/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!roomId) {
      return res.status(400).json({ error: 'Room ID required' });
    }

    if (roomsCol) {
      const result = await roomsCol.deleteOne({ roomId });
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Room not found' });
      }
    } else {
      if (!memoryRooms.has(roomId)) {
        return res.status(404).json({ error: 'Room not found' });
      }
      memoryRooms.delete(roomId);
    }

    // Notify all users in the room that it's been deleted
    io.to(roomId).emit('room_deleted', { roomId });
    
    console.log(`Room ${roomId} deleted`);
    res.json({ success: true, message: 'Room deleted successfully' });
  } catch (err) {
    console.error('delete room error', err);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

// API: Ask AI (optional)
app.post('/api/ask-ai', async (req, res) => {
  try {
    if (!openai) return res.status(400).json({ error: 'AI not enabled. Please set OPENAI_API_KEY in server environment.' });
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt required' });
    }

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.7,
    });

    const text = completion.choices[0]?.message?.content || 'No response';
    res.json({ text });
  } catch (err) {
    console.error('ask-ai error', err);
    res.status(500).json({ error: 'AI request failed: ' + err.message });
  }
});

// In-memory fallback store if no Mongo
const memoryRooms = new Map(); // roomId -> { messages: [...] }

async function getRoom(roomId) {
  if (roomsCol) {
    let doc = await roomsCol.findOne({ roomId });
    if (!doc) {
      doc = { roomId, messages: [], updatedAt: new Date() };
      await roomsCol.insertOne(doc);
    }
    return doc;
  }
  if (!memoryRooms.has(roomId)) {
    memoryRooms.set(roomId, { roomId, messages: [], updatedAt: new Date() });
  }
  return memoryRooms.get(roomId);
}

async function addMessageToRoom(roomId, message) {
  const updatedAt = new Date();
  if (roomsCol) {
    await roomsCol.updateOne(
      { roomId },
      { 
        $push: { messages: { $each: [message], $slice: -50 } }, // Keep last 50 messages
        $set: { updatedAt }
      },
      { upsert: true }
    );
  } else {
    if (!memoryRooms.has(roomId)) {
      memoryRooms.set(roomId, { roomId, messages: [], updatedAt });
    }
    const room = memoryRooms.get(roomId);
    room.messages.push(message);
    if (room.messages.length > 50) room.messages = room.messages.slice(-50);
    room.updatedAt = updatedAt;
  }
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join room
  socket.on('join', async ({ roomId, userId }) => {
    try {
      if (!roomId) return;
      socket.join(roomId);
      socket.roomId = roomId;
      socket.userId = userId;
      
      const room = await getRoom(roomId);
      socket.emit('room_history', room.messages || []);
      
      console.log(`${userId} joined room ${roomId}`);
    } catch (e) {
      console.error('join error', e);
    }
  });

  // Send message
  socket.on('send_message', async ({ roomId, userId, code, timestamp }) => {
    try {
      if (!roomId || !code || typeof code !== 'string') return;
      
      const message = {
        id: Date.now() + '_' + Math.random().toString(36).substring(2),
        userId,
        code: code.trim(),
        timestamp: timestamp || Date.now()
      };
      
      await addMessageToRoom(roomId, message);
      
      // Broadcast to all users in the room
      io.to(roomId).emit('message_received', message);
      
      console.log(`Message sent in ${roomId} by ${userId}`);
    } catch (e) {
      console.error('send_message error', e);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

initMongo()
  .then(() => {
    server.listen(PORT, () => console.log(`Server running on :${PORT}`));
  })
  .catch((err) => {
    console.error('Mongo init failed, continuing without persistence:', err.message);
    server.listen(PORT, () => console.log(`Server running on :${PORT} (no DB)`));
  });
