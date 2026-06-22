const logger = require('../../utils/logger');
const prisma = require('../../utils/prisma');

module.exports = (io, socket) => {
  socket.on('replyMessage', async (data) => {
    // data = { conversationId, content, replyToId, messageType, fileUrl, fileName, fileSize }
    if (!socket.user?.id) return;
    const { conversationId, content, replyToId, messageType, fileUrl, fileName, fileSize } = data;

    try {
      // Create new message as a reply
      const newMessage = await prisma.message.create({
        data: {
          conversationId,
          senderId: socket.user.id,
          content,
          replyToId,
          messageType: messageType || 'TEXT',
          fileUrl: fileUrl || null,
          fileName: fileName || null,
          fileSize: fileSize || null,
          imageUrl: (messageType === 'IMAGE' ? fileUrl : null)
        },
        include: {
          sender: { select: { id: true, name: true, avatar: true } },
          replyTo: { select: { id: true, content: true, senderId: true, sender: { select: { name: true } } } }
        }
      });

      // Update conversation lastMessageAt
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() }
      });

      // Emit ack back to sender
      socket.emit('messageSentAck', { tempId: data.tempId, message: newMessage });

      // Broadcast new message
      io.to(`conversation:${conversationId}`).emit('receiveMessage', newMessage);
      
      logger.info(`User ${socket.user.id} replied to message ${replyToId} in conversation ${conversationId}`);
    } catch (error) {
      logger.error('Error replying to message:', error);
    }
  });
};
