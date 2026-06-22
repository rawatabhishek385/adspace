require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const logger = require('./utils/logger');
// const { createAdapter } = require('@socket.io/redis-adapter');
// const { createClient } = require('redis');

const app = express();
const server = http.createServer(app);

app.use(cors());

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://adspace-phi.vercel.app"],
    credentials: true,
  },
  pingInterval: 25000,
  pingTimeout: 20000,
});

/* Optional Redis Adapter Setup for Horizontal Scaling
if (process.env.REDIS_URL) {
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();
  Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    logger.info("Redis adapter connected");
  });
}
*/

const socketMiddleware = require('./middleware/socketMiddleware');
const registerEvents = require('./events/registerEvents');

io.use(socketMiddleware);
registerEvents(io);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  logger.info(`Socket server running on port ${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
