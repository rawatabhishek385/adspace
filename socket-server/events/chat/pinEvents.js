const logger = require('../../utils/logger');
const prisma = require('../../utils/prisma');

module.exports = (io, socket) => {
  socket.on('conversationPinned', async (data) => {
    // data = { conversationId }
    if (!socket.user?.id) return;
    const { conversationId } = data;

    try {
      // Enforce max 5 limit
      const currentPinsCount = await prisma.pinnedConversation.count({
        where: { userId: socket.user.id }
      });

      if (currentPinsCount >= 5) {
        // We could emit an error back to the specific user if we had a dedicated user room
        // For now, we just reject the action on the backend
        logger.warn(`User ${socket.user.id} tried to pin conversation ${conversationId} but already has 5 pinned`);
        return;
      }

      await prisma.pinnedConversation.create({
        data: {
          userId: socket.user.id,
          conversationId
        }
      });

      // We only broadcast this to the user who pinned it, but since we broadcast to the conversation room,
      // the frontend must filter `userId` to know whose pin list changed, or we just rely on Next.js hydration.
      io.to(`conversation:${conversationId}`).emit('conversationPinned', {
        conversationId,
        userId: socket.user.id
      });
      
      logger.info(`User ${socket.user.id} pinned conversation ${conversationId}`);
    } catch (error) {
      // Ignore unique constraint violation (already pinned)
      if (error.code !== 'P2002') {
        logger.error('Error pinning conversation:', error);
      }
    }
  });

  socket.on('conversationUnpinned', async (data) => {
    // data = { conversationId }
    if (!socket.user?.id) return;
    const { conversationId } = data;

    try {
      await prisma.pinnedConversation.delete({
        where: {
          userId_conversationId: {
            userId: socket.user.id,
            conversationId
          }
        }
      });

      io.to(`conversation:${conversationId}`).emit('conversationUnpinned', {
        conversationId,
        userId: socket.user.id
      });
      
      logger.info(`User ${socket.user.id} unpinned conversation ${conversationId}`);
    } catch (error) {
      if (error.code !== 'P2025') { // Ignore "Record to delete does not exist"
        logger.error('Error unpinning conversation:', error);
      }
    }
  });
};
