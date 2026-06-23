"use client";

import { useSocketContext } from "@/providers/SocketProvider";

// ---------------------------------------------------------------------------
// useSocket — Primary hook for accessing the socket instance
// ---------------------------------------------------------------------------
// Re-exports the context values with a simpler name. Most consumer
// components only need `socket` and `isConnected`.
// ---------------------------------------------------------------------------

export function useSocket() {
  return useSocketContext();
}

export default useSocket;
