const logger = require('../../utils/logger');
const prisma = require('../../utils/prisma');

module.exports = (io, socket) => {
  socket.on('messageDeleted', async (data) => {
    // data = { messageId, deleteForEveryone: boolean }
    if (!socket.user?.id) return;
    const { messageId, deleteForEveryone } = data;

    try {
      const message = await prisma.message.findUnique({
        where: { id: messageId }
      });

      if (!message) return;

      if (deleteForEveryone) {
        // Security check: Only sender can delete for everyone
        if (message.senderId !== socket.user.id) {
          logger.warn(`User ${socket.user.id} attempted to delete message ${messageId} belonging to ${message.senderId} for everyone`);
          return;
        }

        const deletedAt = new Date();
        await prisma.message.update({
          where: { id: messageId },
          data: {
            isDeleted: true,
            deletedAt,
            content: "This message was deleted",
            imageUrl: null,
            fileUrl: null,
            fileName: null
          }
        });

        // Broadcast to everyone
        io.to(`conversation:${message.conversationId}`).emit('messageDeleted', {
          messageId,
          deleteForEveryone: true,
          deletedAt,
          conversationId: message.conversationId
        });

        logger.info(`User ${socket.user.id} deleted message ${messageId} for everyone`);
      } else {
        // Delete for me
        await prisma.messageHide.upsert({
          where: {
            userId_messageId: {
              userId: socket.user.id,
              messageId
            }
          },
          create: {
            userId: socket.user.id,
            messageId
          },
          update: {}
        });

        // Only send back to the user who deleted it (they might have multiple tabs)
        // Since we don't have a direct user-room for chat updates, we can emit to the conversation
        // but tell clients this is a "delete for me" targeting a specific user
        io.to(`conversation:${message.conversationId}`).emit('messageDeleted', {
          messageId,
          deleteForEveryone: false,
          deletedForUserId: socket.user.id,
          conversationId: message.conversationId
        });

        logger.info(`User ${socket.user.id} deleted message ${messageId} for themselves`);
      }
    } catch (error) {
      logger.error('Error deleting message:', error);
    }
  });
};
