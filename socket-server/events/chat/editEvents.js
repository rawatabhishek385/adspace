const logger = require('../../utils/logger');
const prisma = require('../../utils/prisma');

module.exports = (io, socket) => {
  socket.on('messageEdited', async (data) => {
    // data = { messageId, content }
    if (!socket.user?.id) return;
    const { messageId, content } = data;

    try {
      const message = await prisma.message.findUnique({
        where: { id: messageId }
      });

      if (!message) return;

      // Security check: Only the sender can edit their message
      if (message.senderId !== socket.user.id) {
        logger.warn(`User ${socket.user.id} attempted to edit message ${messageId} belonging to ${message.senderId}`);
        return;
      }

      // Update in DB
      const editedAt = new Date();
      const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: {
          content,
          isEdited: true,
          editedAt
        }
      });

      // Broadcast edit to the conversation room
      io.to(`conversation:${message.conversationId}`).emit('messageEdited', {
        messageId,
        content,
        isEdited: true,
        editedAt,
        conversationId: message.conversationId
      });
      
      logger.info(`User ${socket.user.id} edited message ${messageId}`);
    } catch (error) {
      logger.error('Error editing message:', error);
    }
  });
};
