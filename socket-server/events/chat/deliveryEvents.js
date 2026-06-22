module.exports = (io, socket) => {
  socket.on('messageDelivered', (data) => {
    console.log(`messageDelivered event received for message ${data.messageId}`);
    
    // Broadcast deliveryReceipt to the room
    socket.to(`conversation:${data.conversationId}`).emit('deliveryReceipt', {
      messageId: data.messageId,
      deliveredAt: new Date()
    });
  });
};
