const prisma = require('../../utils/prisma');
const logger = require('../../utils/logger');

module.exports = (io, socket) => {
  socket.on('availabilityChanged', async (data) => {
    // data = { userId, status: 'AVAILABLE' | 'BUSY' | 'OFFLINE', responseTime: '1 hour' }
    if (!socket.user?.id) return;
    
    // Security verification: ignore if trying to update someone else's availability
    if (socket.user.id !== data.userId) {
      logger.warn(`User ${socket.user.id} tried to update availability for ${data.userId}`);
      return;
    }

    try {
      await prisma.influencerProfile.update({
        where: { userId: socket.user.id },
        data: {
          availabilityStatus: data.status,
          responseTime: data.responseTime
        }
      });

      // Broadcast to anyone who might be viewing this influencer's profile or cards
      io.emit('availabilityUpdate', {
        userId: socket.user.id,
        status: data.status,
        responseTime: data.responseTime
      });

      logger.info(`User ${socket.user.id} updated availability to ${data.status}`);
    } catch (error) {
      logger.error('Error updating availability:', error);
    }
  });
};
