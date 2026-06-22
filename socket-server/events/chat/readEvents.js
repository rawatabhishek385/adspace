module.exports = (io, socket) => {
  socket.on('messageRead', (data) => {
    console.log(`messageRead event received for conversation ${data.conversationId}`);
    
    // Broadcast messageReadUpdate to the room
    socket.to(`conversation:${data.conversationId}`).emit('messageReadUpdate', {
      conversationId: data.conversationId,
      readBy: data.readerId || data.userId,
      readAt: new Date()
    });
    
    // Read state persistence should be done via existing API/service layer
  });
};
