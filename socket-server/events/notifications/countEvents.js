module.exports = (io, socket) => {
  socket.on('updateUnreadCount', (data) => {
    console.log(`updateUnreadCount event received for user ${data.userId}`);
    // Target: user:{userId}
    // Broadcast: unreadNotificationCountUpdated
    io.to(`user:${data.userId}`).emit('unreadNotificationCountUpdated', data);
  });
};
