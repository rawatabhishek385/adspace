const logger = require('../../utils/logger');
const prisma = require('../../utils/prisma');

module.exports = (io, socket) => {
  // Add a reaction
  socket.on('reactionAdded', async (data) => {
    // data = { messageId, emoji }
    if (!socket.user?.id) return;
    const { messageId, emoji } = data;

    try {
      // Find message to verify it exists and get conversationId for broadcast
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        select: { conversationId: true }
      });

      if (!message) return;

      // Add or update reaction
      const reaction = await prisma.messageReaction.upsert({
        where: {
          userId_messageId_emoji: {
            userId: socket.user.id,
            messageId,
            emoji
          }
        },
        create: {
          userId: socket.user.id,
          messageId,
          emoji
        },
        update: {}
      });

      // Broadcast reaction to the conversation room
      io.to(`conversation:${message.conversationId}`).emit('reactionAdded', {
        messageId,
        emoji,
        userId: socket.user.id,
        reactionId: reaction.id
      });
      
      logger.info(`User ${socket.user.id} added reaction ${emoji} to message ${messageId}`);
    } catch (error) {
      logger.error('Error adding reaction:', error);
    }
  });

  // Remove a reaction
  socket.on('reactionRemoved', async (data) => {
    // data = { messageId, emoji }
    if (!socket.user?.id) return;
    const { messageId, emoji } = data;

    try {
      // Find message to get conversationId for broadcast
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        select: { conversationId: true }
      });

      if (!message) return;

      await prisma.messageReaction.delete({
        where: {
          userId_messageId_emoji: {
            userId: socket.user.id,
            messageId,
            emoji
          }
        }
      });

      // Broadcast removal
      io.to(`conversation:${message.conversationId}`).emit('reactionRemoved', {
        messageId,
        emoji,
        userId: socket.user.id
      });
      
      logger.info(`User ${socket.user.id} removed reaction ${emoji} from message ${messageId}`);
    } catch (error) {
      if (error.code !== 'P2025') { // Ignore "Record to delete does not exist"
        logger.error('Error removing reaction:', error);
      }
    }
  });
};
