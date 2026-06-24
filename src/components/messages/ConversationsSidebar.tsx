"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { getSocket } from "@/lib/socket";

type Conversation = {
  id: string;
  subject: string | null;
  updatedAt: string;
  listing: { id: string; title: string; thumbnail: string | null };
  otherUser: { id: string; name: string; email: string; avatar?: string | null };
  lastMessage: { id: string; content: string; createdAt: string; isMine: boolean } | null;
  unreadCount: number;
  isOnline?: boolean;
  lastSeen?: string;
  isPinned?: boolean;
};

export default function ConversationsSidebar() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/messages/conversations")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setConversations(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewGlobalMessage = (data: { conversationId: string; message: any }) => {
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === data.conversationId);
        if (index === -1) return prev; // If conversation not loaded, ignore or could fetch it

        const conv = prev[index];
        const isMine = data.message.senderId === conv.otherUser.id; // Wait, senderId matches otherUser if they sent it
        
        const updatedConv = {
          ...conv,
          updatedAt: data.message.createdAt,
          unreadCount: conv.otherUser.id === data.message.senderId ? conv.unreadCount + 1 : conv.unreadCount,
          lastMessage: {
            id: data.message.id,
            content: data.message.content,
            createdAt: data.message.createdAt,
            isMine: data.message.senderId !== conv.otherUser.id,
          },
        };

        const newArr = [...prev];
        newArr.splice(index, 1);
        newArr.unshift(updatedConv); // Move to top
        return newArr;
      });
    };

    const handlePresence = (data: { userId: string; isOnline: boolean; lastSeen?: string }) => {
      setConversations((prev) => 
        prev.map((c) => 
          c.otherUser.id === data.userId 
            ? { ...c, isOnline: data.isOnline, lastSeen: data.lastSeen } 
            : c
        )
      );
    };

    socket.on("newGlobalMessage", handleNewGlobalMessage);
    socket.on("presenceUpdate", handlePresence);

    // Initial check for all visible users
    conversations.forEach((c) => {
      socket.emit("checkPresence", c.otherUser.id);
    });

    return () => {
      socket.off("newGlobalMessage", handleNewGlobalMessage);
      socket.off("presenceUpdate", handlePresence);
    };
  }, [conversations.length]);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-12 h-12 bg-slate-50 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-50 rounded w-3/4" />
              <div className="h-3 bg-slate-50 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        <svg className="w-12 h-12 mx-auto mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p className="text-sm">No conversations yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full scrollbar-thin">
      <div className="p-4 border-b border-slate-200 sticky top-0 bg-white/90 backdrop-blur z-10">
        <h2 className="font-semibold text-slate-800">Inbox</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {conversations.map((conv) => {
          const isActive = pathname === `/dashboard/messages/${conv.id}`;

          return (
            <Link
              key={conv.id}
              href={`/dashboard/messages/${conv.id}`}
              className={`block transition-colors ${
                isActive ? "bg-indigo-50/50" : ""
              }`}
            >
              <div className="flex gap-3 p-4 hover:scale-[1.02] transition-transform origin-left">
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-full bg-white shrink-0 overflow-hidden relative shadow-sm border border-slate-100">
                  {conv.listing.thumbnail ? (
                    <img src={conv.listing.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : conv.otherUser.avatar ? (
                    <img src={conv.otherUser.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-600 text-lg font-bold">
                      {conv.otherUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {conv.unreadCount > 0 && (
                    <div className="absolute top-0 right-0 w-4 h-4 bg-indigo-500 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-[9px] font-bold text-white">{conv.unreadCount}</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <div className="flex items-center gap-2 pr-2 overflow-hidden">
                      <h3 className="text-sm font-bold text-slate-800 truncate">
                        {conv.otherUser.name}
                      </h3>
                      {conv.isPinned && (
                        <svg className="w-3.5 h-3.5 text-indigo-500 shrink-0 transform -rotate-45" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                        </svg>
                      )}
                      {conv.isOnline ? (
                        <span className="shrink-0 flex items-center gap-1 text-[10px] text-indigo-600 font-medium bg-indigo-50 px-1.5 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_4px_rgba(99,102,241,0.5)]"></span>
                          Online
                        </span>
                      ) : (
                        <span className="shrink-0 text-[10px] text-slate-400">
                          {conv.lastSeen ? `Seen ${formatDistanceToNow(new Date(conv.lastSeen), { addSuffix: true })}` : ""}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0">
                      {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })}
                    </span>
                  </div>

                  <p className="text-xs text-sky-600 font-medium truncate mb-1">
                    {conv.subject || conv.listing.title}
                  </p>

                  <p className={`text-xs truncate ${conv.unreadCount > 0 ? "text-slate-800 font-semibold" : "text-slate-500"}`}>
                    {conv.lastMessage ? (
                      <>
                        {conv.lastMessage.isMine && <span className="text-slate-400 mr-1">You:</span>}
                        {conv.lastMessage.content}
                      </>
                    ) : (
                      <span className="italic">No messages yet</span>
                    )}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
