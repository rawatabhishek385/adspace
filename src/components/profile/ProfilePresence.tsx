"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useSocket } from "@/hooks/useSocket";
import { SocketEvents } from "@/lib/socket";

interface ProfilePresenceProps {
  userId: string;
  initialIsOnline: boolean;
  initialLastSeen: string | null;
}

export default function ProfilePresence({ userId, initialIsOnline, initialLastSeen }: ProfilePresenceProps) {
  const [isOnline, setIsOnline] = useState(initialIsOnline);
  const [lastSeen, setLastSeen] = useState<string | null>(initialLastSeen);
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handlePresenceUpdate = (data: { userId: string; isOnline: boolean; lastSeen?: string }) => {
      if (data.userId === userId) {
        setIsOnline(data.isOnline);
        if (data.lastSeen) setLastSeen(data.lastSeen);
      }
    };

    socket.on(SocketEvents.PRESENCE_UPDATE, handlePresenceUpdate);

    // Request initial status via socket
    socket.emit(SocketEvents.CHECK_PRESENCE, userId);

    return () => {
      socket.off(SocketEvents.PRESENCE_UPDATE, handlePresenceUpdate);
    };
  }, [socket, isConnected, userId]);

  return (
    <div className="flex items-center justify-center mt-1 mb-4">
      {isOnline ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)] animate-pulse"></span>
          Online Now
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-500 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          {lastSeen ? `Seen ${formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}` : "Offline"}
        </span>
      )}
    </div>
  );
}

