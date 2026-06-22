const logger = require('../utils/logger');

module.exports = (socket, next) => {
  // Extract userId from auth payload or handshake query
  const userId = socket.handshake.auth?.userId || socket.handshake.query?.userId;

  if (!userId) {
    logger.warn('Connection rejected: No userId provided', socket.id);
    return next(new Error('Authentication error: userId is required'));
  }

  // Attach userId to the socket object for downstream usage
  socket.userId = userId;
  next();
};
