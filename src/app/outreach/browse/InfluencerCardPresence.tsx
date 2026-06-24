"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { SocketEvents } from "@/lib/socket";

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
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected) return;

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

    socket.on(SocketEvents.PRESENCE_UPDATE, handlePresenceUpdate);
    socket.on(SocketEvents.AVAILABILITY_UPDATE, handleAvailabilityUpdate);
    
    return () => {
      socket.off(SocketEvents.PRESENCE_UPDATE, handlePresenceUpdate);
      socket.off(SocketEvents.AVAILABILITY_UPDATE, handleAvailabilityUpdate);
    };
  }, [socket, isConnected, userId]);

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

