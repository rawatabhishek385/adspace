const typingUsers = require('../../utils/typingUsers');

module.exports = (io, socket) => {
  socket.on('typing', (data) => {
    console.log(`typing event received from ${data.userId} in conversation ${data.conversationId}`);
    
    if (!typingUsers.has(data.conversationId)) {
      typingUsers.set(data.conversationId, new Set());
    }
    typingUsers.get(data.conversationId).add(data.userId);

    socket.to(`conversation:${data.conversationId}`).emit('userTyping', { 
      userId: data.userId, 
      name: data.name 
    });
  });

  socket.on('stopTyping', (data) => {
    console.log(`stopTyping event received from ${data.userId} in conversation ${data.conversationId}`);
    
    if (typingUsers.has(data.conversationId)) {
      typingUsers.get(data.conversationId).delete(data.userId);
      if (typingUsers.get(data.conversationId).size === 0) {
        typingUsers.delete(data.conversationId);
      }
    }

    socket.to(`conversation:${data.conversationId}`).emit('userStoppedTyping', { 
      userId: data.userId 
    });
  });
};
