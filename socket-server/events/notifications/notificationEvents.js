module.exports = (io, socket) => {
  socket.on('newNotification', (data) => {
    console.log(`newNotification event received for user ${data.userId}`);
    // Target: user:{userId}
    // Broadcast: notificationReceived
    io.to(`user:${data.userId}`).emit('notificationReceived', data);
  });
};
