require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mediasoup = require('mediasoup');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from client directory
app.use(express.static(path.join(__dirname, 'client')));

let workers = [];
let rooms = {};

async function createWorker() {
  return await mediasoup.createWorker({
    logLevel: "warn",
    rtcMinPort: 40000,
    rtcMaxPort: 49999,
  });
}

// Create mediasoup workers
Promise.all([createWorker(), createWorker()]).then((workersArr) => {
  workers = workersArr;
  console.log('MediaSoup workers created');
});

io.on('connection', async (socket) => {
  console.log('Client connected');

  socket.on('join', async (roomId) => {
    let room = rooms[roomId];
    if (!room) {
      const worker = workers[0]; // Simple worker selection
      const router = await worker.createRouter({
        mediaCodecs: [
          {
            kind: 'audio',
            mimeType: 'audio/opus',
            clockRate: 48000,
            channels: 2,
            parameters: {
              "sprop-stereo": 0,
              "useinbandfec": 1,
            },
          },
        ],
      });
      room = { router, peers: new Map() };
      rooms[roomId] = room;
    }

    // Create WebRTC Transport
    const transport = await room.router.createWebRtcTransport({
      listenIps: [
        {
          ip: process.env.MEDIASOUP_LISTEN_IP || '0.0.0.0',
          announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP
        }
      ],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate: 1000000,
    });

    socket.emit('transportParameters', {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    });

    socket.on('transportConnect', async ({ dtlsParameters }) => {
      await transport.connect({ dtlsParameters });
      socket.emit('transportConnected');
    });

    socket.on('produceAudio', async ({ rtpParameters }) => {
      const producer = await transport.produce({
        kind: 'audio',
        rtpParameters,
      });

      room.peers.set(socket.id, { producer, transport });
      socket.emit('producerId', { id: producer.id });

      // Notify other peers
      socket.to(roomId).emit('newProducer', { producerId: producer.id });
    });

    socket.on('disconnect', () => {
      const peer = room?.peers.get(socket.id);
      if (peer) {
        peer.producer.close();
        peer.transport.close();
        room.peers.delete(socket.id);
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

server.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});