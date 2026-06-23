"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { SocketEvents } from "@/lib/socket";

// ---------------------------------------------------------------------------
// useTypingIndicator — Debounced typing indicator for chat conversations
// ---------------------------------------------------------------------------

interface TypingUser {
  userId: string;
  name?: string;
}

interface UseTypingIndicatorOptions {
  /** Conversation ID to scope typing events */
  conversationId: string;
  /** Current user's ID */
  userId: string;
  /** Current user's display name */
  userName?: string;
  /** Debounce delay (ms) before emitting stopTyping. Default: 2000 */
  debounceMs?: number;
}

interface UseTypingIndicatorReturn {
  /** List of users currently typing in this conversation */
  typingUsers: TypingUser[];
  /** Call this when the local user types a keystroke */
  startTyping: () => void;
  /** Call this to immediately signal the user stopped typing */
  stopTyping: () => void;
  /** Whether anyone (other than the current user) is typing */
  isAnyoneTyping: boolean;
}

export function useTypingIndicator({
  conversationId,
  userId,
  userName,
  debounceMs = 2000,
}: UseTypingIndicatorOptions): UseTypingIndicatorReturn {
  const { socket, isConnected } = useSocket();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  // Refs for debounce management
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  // ── Listen for remote typing events ────────────────────────────────────

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleUserTyping = (data: { userId: string; name?: string }) => {
      // Ignore own typing events that bounce back
      if (data.userId === userId) return;

      setTypingUsers((prev) => {
        // Prevent duplicates
        if (prev.some((u) => u.userId === data.userId)) return prev;
        return [...prev, { userId: data.userId, name: data.name }];
      });
    };

    const handleUserStoppedTyping = (data: { userId: string }) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    };

    socket.on(SocketEvents.USER_TYPING, handleUserTyping);
    socket.on(SocketEvents.USER_STOPPED_TYPING, handleUserStoppedTyping);

    return () => {
      socket.off(SocketEvents.USER_TYPING, handleUserTyping);
      socket.off(SocketEvents.USER_STOPPED_TYPING, handleUserStoppedTyping);
    };
  }, [socket, isConnected, userId]);

  // ── Clean up typing state & timer on unmount or conversation change ────

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      // If we were typing when this unmounts, notify the server
      if (isTypingRef.current && socket) {
        socket.emit(SocketEvents.STOP_TYPING, {
          conversationId,
          userId,
        });
        isTypingRef.current = false;
      }

      setTypingUsers([]);
    };
  }, [conversationId, socket, userId]);

  // ── Emit helpers ───────────────────────────────────────────────────────

  const startTyping = useCallback(() => {
    if (!socket || !isConnected) return;

    // Only emit once per burst — debounce subsequent keystrokes
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit(SocketEvents.TYPING, {
        conversationId,
        userId,
        name: userName,
      });
    }

    // Reset the debounce timer
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current && socket) {
        socket.emit(SocketEvents.STOP_TYPING, {
          conversationId,
          userId,
        });
        isTypingRef.current = false;
      }
      typingTimeoutRef.current = null;
    }, debounceMs);
  }, [socket, isConnected, conversationId, userId, userName, debounceMs]);

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (isTypingRef.current && socket) {
      socket.emit(SocketEvents.STOP_TYPING, {
        conversationId,
        userId,
      });
      isTypingRef.current = false;
    }
  }, [socket, conversationId, userId]);

  return {
    typingUsers,
    startTyping,
    stopTyping,
    isAnyoneTyping: typingUsers.length > 0,
  };
}

export default useTypingIndicator;
