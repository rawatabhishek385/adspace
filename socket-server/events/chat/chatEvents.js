module.exports = (io, socket) => {
  socket.on('newMessage', (data) => {
    console.log(`newMessage event received in conversation ${data.conversationId}`);
    
    // Emit to the conversation room
    socket.to(`conversation:${data.conversationId}`).emit('receiveMessage', data);
    
    // Emit delivery state back to the sender
    socket.emit('messageDelivered', { 
      messageId: data.tempId || data.id, 
      status: 'delivered' 
    });
    
    // Unread counts and message persistence are assumed to be handled by 
    // the existing API/service, allowing the socket server to remain stateless 
    // and solely coordinate real-time events.
  });
};
