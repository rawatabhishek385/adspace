"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";

interface InfluencerCardPresenceProps {
  userId: string;
  initialIsOnline: boolean;
  initialAvailabilityStatus: string;
  initialResponseTime: string | null;
}

export default function InfluencerCardPresence({ 
  userId, 
  initialIsOnline, 
  initialAvailabilityStatus,
  initialResponseTime
}: InfluencerCardPresenceProps) {
  const [isOnline, setIsOnline] = useState(initialIsOnline);
  const [availability, setAvailability] = useState(initialAvailabilityStatus);
  const [responseTime, setResponseTime] = useState(initialResponseTime);

  useEffect(() => {
    let s = getSocket();
    let tempSocket = false;

    if (!s) {
      const { io } = require("socket.io-client");
      const tempId = `anon-${Math.random().toString(36).substring(2, 10)}`;
      s = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://127.0.0.1:3001", { 
        path: "/socket.io/",
        auth: { userId: tempId }
      });
      tempSocket = true;
    }

    if (s) {
      const handlePresenceUpdate = (data: { userId: string; isOnline: boolean }) => {
        if (data.userId === userId) {
          setIsOnline(data.isOnline);
        }
      };

      const handleAvailabilityUpdate = (data: { userId: string; status: string; responseTime: string | null }) => {
        if (data.userId === userId) {
          setAvailability(data.status);
          setResponseTime(data.responseTime);
        }
      };

      s.on("presenceUpdate", handlePresenceUpdate);
      s.on("availabilityUpdate", handleAvailabilityUpdate);
      
      return () => {
        if (s) {
          s.off("presenceUpdate", handlePresenceUpdate);
          s.off("availabilityUpdate", handleAvailabilityUpdate);
          if (tempSocket) {
            s.disconnect();
          }
        }
      };
    }
  }, [userId]);

  return (
    <div className="flex flex-col items-start gap-1 mt-3 mb-2 text-xs">
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-slate-300'}`}></span>
        <span className={isOnline ? "text-emerald-700 font-medium" : "text-slate-500 font-medium"}>
          {isOnline ? "Online" : "Offline"}
        </span>
      </div>
      
      {availability === 'AVAILABLE' && (
        <span className="text-blue-600 font-medium px-2 py-0.5 bg-blue-50 rounded-md">
          Available for collaboration
        </span>
      )}
      {availability === 'BUSY' && (
        <span className="text-amber-600 font-medium px-2 py-0.5 bg-amber-50 rounded-md">
          Currently busy
        </span>
      )}
      {availability === 'OFFLINE' && (
        <span className="text-slate-600 font-medium px-2 py-0.5 bg-slate-50 rounded-md">
          Not available
        </span>
      )}

      {responseTime && (
        <span className="text-slate-500 px-2">
          Responds within {responseTime}
        </span>
      )}
    </div>
  );
}
