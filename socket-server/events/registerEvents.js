const connectionHandler = require('../socketHandlers/connectionHandler');
const disconnectHandler = require('../socketHandlers/disconnectHandler');
const roomHandler = require('../socketHandlers/roomHandler');

const chatEvents = require('./chat/chatEvents');
const typingEvents = require('./chat/typingEvents');
const readEvents = require('./chat/readEvents');
const deliveryEvents = require('./chat/deliveryEvents');

const notificationEvents = require('./notifications/notificationEvents');
const broadcastEvents = require('./notifications/broadcastEvents');
const readNotificationEvents = require('./notifications/readEvents');
const countEvents = require('./notifications/countEvents');

const rateLimiter = require('../middleware/rateLimiter');

module.exports = (io) => {
  io.on('connection', (socket) => {
    // 0. Rate Limiting Middleware
    socket.use(([event, ...args], next) => {
      rateLimiter(socket, event, next);
    });

    // 1. Connection Event
    connectionHandler(io, socket);

    // 2. Room Management Events
    roomHandler(io, socket);

    // 3. Chat Events
    chatEvents(io, socket);
    typingEvents(io, socket);
    readEvents(io, socket);
    deliveryEvents(io, socket);

    // 4. Notification Events
    notificationEvents(io, socket);
    broadcastEvents(io, socket);
    readNotificationEvents(io, socket);
    countEvents(io, socket);

    // 5. Disconnect Event
    socket.on('disconnect', () => {
      disconnectHandler(io, socket);
    });
  });
};
