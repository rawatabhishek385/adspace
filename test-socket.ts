import { io } from "socket.io-client";

const socket = io("http://127.0.0.1:3001", { path: "/socket.io/" });

socket.on("connect", () => {
  console.log("Connected to socket:", socket.id);
  
  // Emulate user "Two"
  socket.emit("userOnline", "cmqhsxjjo0004nfesyrgn6pdz");
  socket.emit("joinConversation", "cmqjefzqs0003nfx4957g14v5");
  
  setTimeout(() => {
    // Send a message to "three" in the existing conversation
    const tempId = `temp-${Date.now()}`;
    console.log("Emitting sendMessage...");
    socket.emit("sendMessage", {
      conversationId: "cmqjefzqs0003nfx4957g14v5",
      senderId: "cmqhsxjjo0004nfesyrgn6pdz",
      content: "test auto reply",
      tempId,
      messageType: "TEXT",
    });
  }, 1000);
});

socket.on("connect_error", (err) => {
  console.log(`connect_error due to ${err.message}`);
});

socket.on("messageSentAck", (data) => {
  console.log("Received messageSentAck:", data);
});

socket.on("receiveMessage", (data) => {
  console.log("Received receiveMessage:", data);
});

socket.on("messageError", (data) => {
  console.log("Received messageError:", data);
});

// remove process.exit
setTimeout(() => {
  console.log("Disconnecting...");
  socket.disconnect();
}, 5000);
