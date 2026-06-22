const logger = require('../utils/logger');

module.exports = (io, socket) => {
  logger.info(`Socket connected: ${socket.id}`);
  // Initial socket setup can be done here
};
