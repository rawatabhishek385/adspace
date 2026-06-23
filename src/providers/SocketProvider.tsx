"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSession, signOut } from "next-auth/react";
import type { Socket } from "socket.io-client";
import {
  connectSocket,
  disconnectSocket,
  getSocket,
  SocketEvents,
} from "@/lib/socket";

// ---------------------------------------------------------------------------
// Context types
// ---------------------------------------------------------------------------

type ConnectionStatus = "disconnected" | "connecting" | "connected";

interface SocketContextValue {
  /** The live Socket.IO instance (null when no session exists) */
  socket: Socket | null;
  /** Reactive connection status */
  status: ConnectionStatus;
  /** Whether the socket is currently connected */
  isConnected: boolean;
  /** Manually trigger a reconnection */
  reconnect: () => void;
  /** Manually disconnect (used on logout) */
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  status: "disconnected",
  isConnected: false,
  reconnect: () => {},
  disconnect: () => {},
});

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface SocketProviderProps {
  children: React.ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const { data: session, status: sessionStatus } = useSession();
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");

  // Track whether we already connected for a given userId so we don't
  // double-fire the effect on React strict-mode double-mount.
  const connectedUserRef = useRef<string | null>(null);

  // ── Connect / disconnect based on session ──────────────────────────────

  useEffect(() => {
    // Wait until next-auth finishes loading
    if (sessionStatus === "loading") return;

    const userId = session?.user?.id;

    // No session → ensure we are disconnected
    if (!userId) {
      if (connectedUserRef.current) {
        disconnectSocket();
        connectedUserRef.current = null;
        setConnectionStatus("disconnected");
      }
      return;
    }

    // Already connected for this user → skip
    if (connectedUserRef.current === userId && getSocket()?.connected) {
      return;
    }

    // ── Initiate connection ────────────────────────────────────────────

    setConnectionStatus("connecting");
    connectedUserRef.current = userId;

    const sock = connectSocket({ userId });

    // Wire reactive status updates
    const onConnect = () => setConnectionStatus("connected");
    const onDisconnect = () => setConnectionStatus("disconnected");
    const onConnectError = (err: Error) => {
      setConnectionStatus("disconnected");

      // If the server rejects our auth (userId is required), sign out
      if (err.message?.includes("Authentication error")) {
        signOut({ callbackUrl: "/login" });
      }
    };

    sock.on(SocketEvents.CONNECT, onConnect);
    sock.on(SocketEvents.DISCONNECT, onDisconnect);
    sock.on(SocketEvents.CONNECT_ERROR, onConnectError);

    // If already connected synchronously (rare but possible on reconnect)
    if (sock.connected) {
      setConnectionStatus("connected");
    }

    // ── Cleanup ────────────────────────────────────────────────────────
    return () => {
      sock.off(SocketEvents.CONNECT, onConnect);
      sock.off(SocketEvents.DISCONNECT, onDisconnect);
      sock.off(SocketEvents.CONNECT_ERROR, onConnectError);
    };
  }, [session?.user?.id, sessionStatus]);

  // ── Manual controls ────────────────────────────────────────────────────

  const reconnect = useCallback(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    setConnectionStatus("connecting");
    connectSocket({ userId });
  }, [session?.user?.id]);

  const disconnect = useCallback(() => {
    disconnectSocket();
    connectedUserRef.current = null;
    setConnectionStatus("disconnected");
  }, []);

  // ── Context value (memoised to prevent unnecessary re-renders) ─────────

  const value = useMemo<SocketContextValue>(
    () => ({
      socket: getSocket(),
      status: connectionStatus,
      isConnected: connectionStatus === "connected",
      reconnect,
      disconnect,
    }),
    [connectionStatus, reconnect, disconnect]
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Access the socket context from any client component.
 *
 * Must be used within `<SocketProvider>`.
 */
export function useSocketContext(): SocketContextValue {
  const ctx = useContext(SocketContext);
  if (ctx === undefined) {
    throw new Error("useSocketContext must be used within a <SocketProvider>");
  }
  return ctx;
}

export default SocketProvider;
