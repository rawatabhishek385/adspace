"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { getSocket } from "@/lib/socket";

interface ProfilePresenceProps {
  userId: string;
  initialIsOnline: boolean;
  initialLastSeen: string | null;
}

export default function ProfilePresence({ userId, initialIsOnline, initialLastSeen }: ProfilePresenceProps) {
  const [isOnline, setIsOnline] = useState(initialIsOnline);
  const [lastSeen, setLastSeen] = useState<string | null>(initialLastSeen);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Use existing socket or create a temporary one for checking presence
    let s = getSocket();
    let tempSocket = false;

    if (!s) {
      const { io } = require("socket.io-client");
      // Use an anonymous session id or fake user id to satisfy the backend requirement
      const tempId = `anon-${Math.random().toString(36).substring(2, 10)}`;
      s = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://127.0.0.1:3001", { 
        path: "/socket.io/",
        auth: { userId: tempId }
      });
      tempSocket = true;
    }

    if (s) {
      const handlePresenceUpdate = (data: { userId: string; isOnline: boolean; lastSeen?: string }) => {
        if (data.userId === userId) {
          setIsOnline(data.isOnline);
          if (data.lastSeen) setLastSeen(data.lastSeen);
        }
      };

      s.on("presenceUpdate", handlePresenceUpdate);
      
      // Request initial status via socket
      s.emit("checkPresence", userId);

      return () => {
        if (s) {
          s.off("presenceUpdate", handlePresenceUpdate);
          if (tempSocket) {
            s.disconnect();
          }
        }
      };
    }
  }, [userId]);

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
