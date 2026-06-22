const onlineUsers = require('../utils/onlineUsers');
const activeRooms = require('../utils/activeRooms');
const typingUsers = require('../utils/typingUsers');
const logger = require('../utils/logger');

module.exports = (io, socket) => {
  logger.info(`Socket disconnected: ${socket.id}`);
  
  let disconnectedUserId = null;
  for (const [userId, sockets] of onlineUsers.entries()) {
    if (sockets.has && sockets.has(socket.id)) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        onlineUsers.delete(userId);
        disconnectedUserId = userId;
      }
      break;
    } else if (sockets === socket.id) {
      onlineUsers.delete(userId);
      disconnectedUserId = userId;
      break;
    }
  }

  if (disconnectedUserId) {
    logger.info(`User ${disconnectedUserId} went offline.`);
    io.emit("presenceUpdate", { userId: disconnectedUserId, isOnline: false, lastSeen: new Date() });
    
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

  for (const [roomId, socketIds] of activeRooms.entries()) {
    if (socketIds.has(socket.id)) {
      socketIds.delete(socket.id);
      if (socketIds.size === 0) {
        activeRooms.delete(roomId);
      }
    }
  }
};
