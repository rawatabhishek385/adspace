module.exports = (io, socket) => {
  socket.on('broadcastNotification', (data) => {
    console.log(`broadcastNotification event received`);
    // Target: allUsers
    // Broadcast: adminAnnouncement
    io.to('allUsers').emit('adminAnnouncement', data);
  });
};
