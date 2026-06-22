import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://127.0.0.1:3001";

let socket: Socket | null = null;

export const connectSocket = (userId: string): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
    });
  }

  if (socket.disconnected) {
    socket.connect();
    
    // Register the user online immediately after connection
    socket.on("connect", () => {
      socket?.emit("userOnline", userId);
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => {
  return socket;
};
