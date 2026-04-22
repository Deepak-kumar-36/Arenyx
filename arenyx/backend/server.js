require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const CrowdSimulator = require('./crowdSimulator');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

const simulator = new CrowdSimulator(io);
simulator.start();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.emit('crowd_update', { gates: simulator.gates, concessions: simulator.concessions });

  socket.on('staff_broadcast', (message) => {
    io.emit('alert_received', {
      id: Date.now(),
      message,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('mark_resolved', (payload) => {
    if (typeof payload === 'object') {
       simulator.markResolved(payload.id, payload.type);
    } else {
       simulator.markResolved(payload, 'GATE');
    }
  });

  const { askAttendeeGuide } = require('./geminiService');

  socket.on('client_chat', async (query) => {
    try {
      const state = { gates: simulator.gates, concessions: simulator.concessions };
      const reply = await askAttendeeGuide(query, state);
      socket.emit('server_chat', { text: reply });
    } catch (err) {
      socket.emit('server_chat', { text: "I'm having trouble retrieving live data right now." });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Arenyx Backend running on port ${PORT}`);
});
