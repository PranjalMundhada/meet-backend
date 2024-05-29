import express from 'express';
import multer from 'multer';
import cors from 'cors'
import Fuse from 'fuse.js';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.port || 8000;

app.use(express.json());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS || '*',
  methods: ["GET", "POST"]
}));

const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
    cors: {
        origin: "*",  
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {

  socket.on("user-message", ({ message, time, userName, statusAttachment, filename }) => {
      io.emit("message", { message, time, userName, statusAttachment, filename });
  });

  socket.on('disconnect', () => {
    console.log('user disconnected:', socket.id);
  });

});

app.post('/search', (req, res) => {
  const text = req.query.text;
  const { chunks } = req.body;

  if (!text) {
    return res.status(400).json({ message: 'Text query parameter is required' });
  }

  if (!chunks || !Array.isArray(chunks)) {
    return res.status(400).json({ message: 'Chunks are required and must be an array' });
  }

  const options = {
    includeScore: true,
    keys: ['text'],
    threshold: 0.3
  };

  const fuse = new Fuse(chunks, options);
  const result = fuse.search(text);

  res.json(result.map(res => res.item));
});

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


