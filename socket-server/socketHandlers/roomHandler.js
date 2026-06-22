const activeRooms = require('../utils/activeRooms');

module.exports = (io, socket) => {
  socket.on('joinUserRoom', (userId) => {
    socket.join(`user:${userId}`);
    socket.join('allUsers');
    console.log(`Socket ${socket.id} joined user:${userId} and allUsers`);
  });

  socket.on('joinConversation', (conversationId) => {
    const roomName = `conversation:${conversationId}`;
    socket.join(roomName);
    console.log(`Socket ${socket.id} joined ${roomName}`);

    // Update activeRooms map
    if (!activeRooms.has(conversationId)) {
      activeRooms.set(conversationId, new Set());
    }
    activeRooms.get(conversationId).add(socket.id);
  });

  socket.on('leaveConversation', (conversationId) => {
    const roomName = `conversation:${conversationId}`;
    socket.leave(roomName);
    console.log(`Socket ${socket.id} left ${roomName}`);

    // Update activeRooms map
    if (activeRooms.has(conversationId)) {
      activeRooms.get(conversationId).delete(socket.id);
      if (activeRooms.get(conversationId).size === 0) {
        activeRooms.delete(conversationId);
      }
    }
  });
};
