const userSocketMap = require('../../utils/userSocketMap');
const prisma = require('../../utils/prisma');

module.exports = (io, socket) => {
  socket.on('checkPresence', async (targetUserId) => {
    // Check memory first
    if (userSocketMap.has(targetUserId) && userSocketMap.get(targetUserId).size > 0) {
      socket.emit('presenceUpdate', { userId: targetUserId, isOnline: true });
      return;
    }
    
    // If not in memory, fetch from DB
    try {
      const user = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { lastSeen: true, isOnline: true }
      });
      if (user) {
        socket.emit('presenceUpdate', { 
          userId: targetUserId, 
          isOnline: user.isOnline, 
          lastSeen: user.lastSeen 
        });
      }
    } catch (err) {
      console.error('Error fetching presence:', err);
    }
  });

  socket.on('subscribePresence', (targetUserId) => {
    socket.join(`presence:${targetUserId}`);
  });
  
  socket.on('unsubscribePresence', (targetUserId) => {
    socket.leave(`presence:${targetUserId}`);
  });
};
