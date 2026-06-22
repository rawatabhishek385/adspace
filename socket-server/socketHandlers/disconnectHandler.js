const userSocketMap = require('../utils/userSocketMap');
const activeRooms = require('../utils/activeRooms');
const typingUsers = require('../utils/typingUsers');
const logger = require('../utils/logger');
const prisma = require('../utils/prisma');

module.exports = async (io, socket) => {
  logger.info(`Socket disconnected: ${socket.id}`);
  
  if (socket.user?.id && userSocketMap.has(socket.user.id)) {
    const userSockets = userSocketMap.get(socket.user.id);
    userSockets.delete(socket.id);

    if (userSockets.size === 0) {
      userSocketMap.delete(socket.user.id);
      const disconnectedUserId = socket.user.id;
      
      logger.info(`User ${disconnectedUserId} went offline.`);
      
      const lastSeen = new Date();
      
      try {
        await prisma.user.update({
          where: { id: disconnectedUserId },
          data: { isOnline: false, lastSeen }
        });
      } catch (error) {
        logger.error(`Error updating offline status for ${disconnectedUserId}:`, error);
      }

      io.emit("presenceUpdate", { userId: disconnectedUserId, isOnline: false, lastSeen });
      io.emit("userOffline", { userId: disconnectedUserId, lastSeen });
      io.emit("lastSeenUpdate", { userId: disconnectedUserId, lastSeen });
      
      // Clean up typingUsers if this user was typing anywhere
      for (const [conversationId, users] of typingUsers.entries()) {
        if (users.has(disconnectedUserId)) {
          users.delete(disconnectedUserId);
          io.to(`conversation:${conversationId}`).emit('userStoppedTyping', { userId: disconnectedUserId });
          if (users.size === 0) {
            typingUsers.delete(conversationId);
          }
        }
      }
    }
  }

  for (const [roomId, socketIds] of activeRooms.entries()) {
    if (socketIds.has(socket.id)) {
      socketIds.delete(socket.id);
      if (socketIds.size === 0) {
        activeRooms.delete(roomId);
      }
    }
  }
};
