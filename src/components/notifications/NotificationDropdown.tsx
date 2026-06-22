"use client";

import { useState, useEffect, useRef } from "react";
import NotificationCard from "./NotificationCard";
import { getSocket } from "@/lib/socket";
import { useSession } from "next-auth/react";

interface NotificationDropdownProps {
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

export default function NotificationDropdown({ onClose, onUnreadCountChange }: NotificationDropdownProps) {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications");
        const data = await res.json();
        if (data.success) {
          setNotifications(data.data);
          if (onUnreadCountChange) {
            onUnreadCountChange(data.data.filter((n: any) => !n.isRead).length);
          }
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    const socket = getSocket();
    if (!socket) return;

    const handleNewNotification = (notification: any) => {
      setNotifications(prev => [notification, ...prev]);
    };

    const handleReadSync = ({ notificationId }: { notificationId: string }) => {
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n));
    };

    socket.on("newNotification", handleNewNotification);
    socket.on("notificationReadSync", handleReadSync);

    return () => {
      socket.off("newNotification", handleNewNotification);
      socket.off("notificationReadSync", handleReadSync);
    };
  }, []);

  // Sync unread count to parent whenever notifications change
  useEffect(() => {
    if (onUnreadCountChange && !loading) {
      onUnreadCountChange(notifications.filter((n: any) => !n.isRead).length);
    }
  }, [notifications, onUnreadCountChange, loading]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const markAsRead = async (id?: string) => {
    try {
      const socket = getSocket();
      
      // Update local state first
      setNotifications((prev) => prev.map((n) => (id ? (n.id === id ? { ...n, isRead: true } : n) : { ...n, isRead: true })));

      if (id && socket && session?.user?.id) {
        // Emit socket event for instant sync
        socket.emit("markNotificationRead", { notificationId: id, userId: session.user.id });
      }

      // Still call API to ensure it's saved (if bulk or socket fails)
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Grouping logic
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const grouped = notifications.reduce((groups, notif) => {
    const notifDate = new Date(notif.createdAt);
    if (notifDate >= today) {
      groups.today.push(notif);
    } else if (notifDate >= yesterday) {
      groups.yesterday.push(notif);
    } else {
      groups.older.push(notif);
    }
    return groups;
  }, { today: [] as any[], yesterday: [] as any[], older: [] as any[] });

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-14 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 flex flex-col"
    >
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <h3 className="font-bold text-slate-800">Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={() => markAsRead()}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="overflow-y-auto max-h-[400px]">
        {loading ? (
          <div className="p-8 text-center text-slate-500">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading notifications...
          </div>
        ) : notifications.length > 0 ? (
          <>
            {grouped.today.length > 0 && (
              <div className="mb-2">
                <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">Today</div>
                {grouped.today.map((notif: any) => (
                  <NotificationCard key={notif.id} notification={notif} onRead={(id) => markAsRead(id)} />
                ))}
              </div>
            )}
            {grouped.yesterday.length > 0 && (
              <div className="mb-2">
                <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">Yesterday</div>
                {grouped.yesterday.map((notif: any) => (
                  <NotificationCard key={notif.id} notification={notif} onRead={(id) => markAsRead(id)} />
                ))}
              </div>
            )}
            {grouped.older.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">Older</div>
                {grouped.older.map((notif: any) => (
                  <NotificationCard key={notif.id} notification={notif} onRead={(id) => markAsRead(id)} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center text-slate-500">
            <div className="text-3xl mb-2">📭</div>
            <p>You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
}
