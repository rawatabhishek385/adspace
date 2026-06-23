"use client";

import { useCallback, useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { SocketEvents } from "@/lib/socket";

// ---------------------------------------------------------------------------
// useNotifications — Real-time notification management
// ---------------------------------------------------------------------------

export interface SocketNotification {
  id?: string;
  userId: string;
  type?: string;
  title?: string;
  message?: string;
  data?: Record<string, unknown>;
  read?: boolean;
  createdAt?: string;
  [key: string]: unknown;
}

interface UseNotificationsReturn {
  /** Live notification feed (newest first) */
  notifications: SocketNotification[];
  /** Current unread count */
  unreadCount: number;
  /** Send a notification to another user via the socket server */
  sendNotification: (notification: SocketNotification) => void;
  /** Mark a notification as read and sync across tabs */
  markAsRead: (notificationId: string, userId: string) => void;
  /** Broadcast a notification to all users (admin only) */
  broadcastNotification: (data: Record<string, unknown>) => void;
  /** Clear local notification state */
  clearNotifications: () => void;
}

export function useNotifications(): UseNotificationsReturn {
  const { socket, isConnected } = useSocket();
  const [notifications, setNotifications] = useState<SocketNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // ── Listen for incoming notifications ──────────────────────────────────

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNotificationReceived = (data: SocketNotification) => {
      setNotifications((prev) => [data, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    const handleNotificationReadUpdate = (data: {
      notificationId?: string;
      userId?: string;
    }) => {
      if (data.notificationId) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === data.notificationId ? { ...n, read: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    };

    const handleUnreadCountUpdated = (data: { count?: number }) => {
      if (typeof data.count === "number") {
        setUnreadCount(data.count);
      }
    };

    const handleAdminAnnouncement = (data: Record<string, unknown>) => {
      const announcement: SocketNotification = {
        userId: "system",
        type: "announcement",
        ...data,
      };
      setNotifications((prev) => [announcement, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on(SocketEvents.NOTIFICATION_RECEIVED, handleNotificationReceived);
    socket.on(
      SocketEvents.NOTIFICATION_READ_UPDATE,
      handleNotificationReadUpdate
    );
    socket.on(SocketEvents.UNREAD_COUNT_UPDATED, handleUnreadCountUpdated);
    socket.on(SocketEvents.ADMIN_ANNOUNCEMENT, handleAdminAnnouncement);

    return () => {
      socket.off(
        SocketEvents.NOTIFICATION_RECEIVED,
        handleNotificationReceived
      );
      socket.off(
        SocketEvents.NOTIFICATION_READ_UPDATE,
        handleNotificationReadUpdate
      );
      socket.off(SocketEvents.UNREAD_COUNT_UPDATED, handleUnreadCountUpdated);
      socket.off(SocketEvents.ADMIN_ANNOUNCEMENT, handleAdminAnnouncement);
    };
  }, [socket, isConnected]);

  // ── Emit helpers ───────────────────────────────────────────────────────

  const sendNotification = useCallback(
    (notification: SocketNotification) => {
      if (socket && isConnected) {
        socket.emit(SocketEvents.NEW_NOTIFICATION, notification);
      }
    },
    [socket, isConnected]
  );

  const markAsRead = useCallback(
    (notificationId: string, userId: string) => {
      if (socket && isConnected) {
        socket.emit(SocketEvents.MARK_NOTIFICATION_READ, {
          notificationId,
          userId,
        });

        // Optimistic local update
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    },
    [socket, isConnected]
  );

  const broadcastNotification = useCallback(
    (data: Record<string, unknown>) => {
      if (socket && isConnected) {
        socket.emit(SocketEvents.BROADCAST_NOTIFICATION, data);
      }
    },
    [socket, isConnected]
  );

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    sendNotification,
    markAsRead,
    broadcastNotification,
    clearNotifications,
  };
}

export default useNotifications;
