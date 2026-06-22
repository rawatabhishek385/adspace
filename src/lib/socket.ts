import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://127.0.0.1:3001";

let socket: Socket | null = null;

export const connectSocket = (userId: string): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }

  if (socket.disconnected) {
    socket.connect();
    
    socket.off("connect");
    socket.on("connect", () => {
      console.log("connected");
      socket?.emit("joinUserRoom", userId);
    });

    socket.off("disconnect");
    socket.on("disconnect", () => {
      console.log("disconnected");
    });

    socket.io.off("reconnect_attempt");
    socket.io.on("reconnect_attempt", () => {
      console.log("reconnecting");
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
