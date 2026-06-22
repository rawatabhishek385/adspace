module.exports = (io, socket) => {
  socket.on('markNotificationRead', (data) => {
    console.log(`markNotificationRead event received for user ${data.userId}`);
    // Target: user:{userId}
    // Broadcast: notificationReadUpdate
    socket.to(`user:${data.userId}`).emit('notificationReadUpdate', data);
  });
};
