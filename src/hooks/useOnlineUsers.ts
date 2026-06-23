"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { SocketEvents } from "@/lib/socket";

// ---------------------------------------------------------------------------
// useOnlineUsers — Tracks presence of other users in real-time
// ---------------------------------------------------------------------------

export interface UserPresence {
  userId: string;
  isOnline: boolean;
  lastSeen?: Date | string;
}

interface UseOnlineUsersReturn {
  /** Map of userId → online status */
  onlineUsers: Map<string, UserPresence>;
  /** Check if a specific user is online */
  isUserOnline: (userId: string) => boolean;
  /** Get presence info for a specific user */
  getUserPresence: (userId: string) => UserPresence | undefined;
  /** Request the server to check a user's presence */
  checkPresence: (userId: string) => void;
  /** Subscribe to real-time updates for a user's presence */
  subscribePresence: (userId: string) => void;
  /** Unsubscribe from a user's presence updates */
  unsubscribePresence: (userId: string) => void;
}

export function useOnlineUsers(): UseOnlineUsersReturn {
  const { socket, isConnected } = useSocket();
  const [onlineUsers, setOnlineUsers] = useState<Map<string, UserPresence>>(
    () => new Map()
  );

  // Track subscribed user IDs for cleanup
  const subscribedRef = useRef<Set<string>>(new Set());

  // ── Event listeners ────────────────────────────────────────────────────

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handlePresenceUpdate = (data: {
      userId: string;
      isOnline: boolean;
      lastSeen?: string;
    }) => {
      setOnlineUsers((prev) => {
        const next = new Map(prev);
        next.set(data.userId, {
          userId: data.userId,
          isOnline: data.isOnline,
          lastSeen: data.lastSeen,
        });
        return next;
      });
    };

    const handleUserOnline = (data: { userId: string }) => {
      setOnlineUsers((prev) => {
        const next = new Map(prev);
        next.set(data.userId, {
          userId: data.userId,
          isOnline: true,
        });
        return next;
      });
    };

    const handleUserOffline = (data: {
      userId: string;
      lastSeen?: string;
    }) => {
      setOnlineUsers((prev) => {
        const next = new Map(prev);
        next.set(data.userId, {
          userId: data.userId,
          isOnline: false,
          lastSeen: data.lastSeen,
        });
        return next;
      });
    };

    const handleLastSeenUpdate = (data: {
      userId: string;
      lastSeen: string;
    }) => {
      setOnlineUsers((prev) => {
        const next = new Map(prev);
        const existing = prev.get(data.userId);
        next.set(data.userId, {
          userId: data.userId,
          isOnline: existing?.isOnline ?? false,
          lastSeen: data.lastSeen,
        });
        return next;
      });
    };

    const handleAvailabilityUpdate = (data: {
      userId: string;
      status: string;
      responseTime?: string;
    }) => {
      // Availability is separate from online/offline but we still surface it
      setOnlineUsers((prev) => {
        const next = new Map(prev);
        const existing = prev.get(data.userId);
        if (existing) {
          next.set(data.userId, { ...existing });
        }
        return next;
      });
    };

    socket.on(SocketEvents.PRESENCE_UPDATE, handlePresenceUpdate);
    socket.on(SocketEvents.USER_ONLINE, handleUserOnline);
    socket.on(SocketEvents.USER_OFFLINE, handleUserOffline);
    socket.on(SocketEvents.LAST_SEEN_UPDATE, handleLastSeenUpdate);
    socket.on(SocketEvents.AVAILABILITY_UPDATE, handleAvailabilityUpdate);

    return () => {
      socket.off(SocketEvents.PRESENCE_UPDATE, handlePresenceUpdate);
      socket.off(SocketEvents.USER_ONLINE, handleUserOnline);
      socket.off(SocketEvents.USER_OFFLINE, handleUserOffline);
      socket.off(SocketEvents.LAST_SEEN_UPDATE, handleLastSeenUpdate);
      socket.off(SocketEvents.AVAILABILITY_UPDATE, handleAvailabilityUpdate);
    };
  }, [socket, isConnected]);

  // ── Cleanup subscriptions on unmount ───────────────────────────────────

  useEffect(() => {
    return () => {
      if (socket) {
        subscribedRef.current.forEach((userId) => {
          socket.emit(SocketEvents.UNSUBSCRIBE_PRESENCE, userId);
        });
        subscribedRef.current.clear();
      }
    };
  }, [socket]);

  // ── Public helpers ─────────────────────────────────────────────────────

  const isUserOnline = useCallback(
    (userId: string): boolean => {
      return onlineUsers.get(userId)?.isOnline ?? false;
    },
    [onlineUsers]
  );

  const getUserPresence = useCallback(
    (userId: string): UserPresence | undefined => {
      return onlineUsers.get(userId);
    },
    [onlineUsers]
  );

  const checkPresence = useCallback(
    (userId: string) => {
      if (socket && isConnected) {
        socket.emit(SocketEvents.CHECK_PRESENCE, userId);
      }
    },
    [socket, isConnected]
  );

  const subscribePresence = useCallback(
    (userId: string) => {
      if (socket && isConnected) {
        socket.emit(SocketEvents.SUBSCRIBE_PRESENCE, userId);
        subscribedRef.current.add(userId);
      }
    },
    [socket, isConnected]
  );

  const unsubscribePresence = useCallback(
    (userId: string) => {
      if (socket && isConnected) {
        socket.emit(SocketEvents.UNSUBSCRIBE_PRESENCE, userId);
        subscribedRef.current.delete(userId);
      }
    },
    [socket, isConnected]
  );

  return {
    onlineUsers,
    isUserOnline,
    getUserPresence,
    checkPresence,
    subscribePresence,
    unsubscribePresence,
  };
}

export default useOnlineUsers;
