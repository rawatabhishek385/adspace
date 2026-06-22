const logger = require('../utils/logger');
const userSocketMap = require('../utils/userSocketMap');
const prisma = require('../utils/prisma');

module.exports = async (io, socket) => {
  logger.info(`Socket connected: ${socket.id} (User: ${socket.user?.id || 'unknown'})`);

  if (socket.user?.id) {
    if (!userSocketMap.has(socket.user.id)) {
      userSocketMap.set(socket.user.id, new Set());
    }

    const userSockets = userSocketMap.get(socket.user.id);
    userSockets.add(socket.id);

    // If this is the first active connection for the user, mark them online in the DB
    if (userSockets.size === 1) {
      try {
        await prisma.user.update({
          where: { id: socket.user.id },
          data: { isOnline: true }
        });
        logger.info(`User ${socket.user.id} marked as ONLINE in DB.`);
        
        // Broadcast presence
        io.emit('presenceUpdate', { userId: socket.user.id, isOnline: true });
        io.emit('userOnline', { userId: socket.user.id });
      } catch (error) {
        logger.error(`Error updating online status for ${socket.user.id}:`, error);
      }
    }
  }
};
