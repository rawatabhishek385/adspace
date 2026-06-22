"use client";

import Image from "next/image";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";

interface DetailsPaneProps {
  conversation: any;
  currentUser: any;
  pinnedMessage: any;
  starredMessages: any[];
  isOnline?: boolean;
  lastSeen?: string | null;
}

export default function DetailsPane({ conversation, currentUser, pinnedMessage, starredMessages, isOnline, lastSeen }: DetailsPaneProps) {
  const currentUserId = currentUser?.id;
  const otherUser = conversation.buyer.id === currentUserId ? conversation.owner : conversation.buyer;

  return (
    <div className="w-full h-full flex flex-col bg-slate-50/50 backdrop-blur-sm border-l border-slate-200/60">
      {/* Profile Section */}
      <div className="flex flex-col items-center p-6 border-b border-slate-200/60 bg-white/40">
        <div className="relative w-24 h-24 rounded-full overflow-hidden mb-4 shadow-md ring-4 ring-white">
          <Image 
            src={otherUser.avatar || "/placeholder-avatar.jpg"} 
            alt={otherUser.name} 
            fill 
            className="object-cover"
          />
        </div>
        <h2 className="text-xl font-bold text-slate-800">{otherUser.name}</h2>
        {isOnline ? (
          <p className="text-sm text-indigo-600 font-medium mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></span>
            Online
          </p>
        ) : (
          <p className="text-xs text-slate-400 mt-1">
            {lastSeen ? `Seen ${formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}` : "Offline"}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">

        {/* Pinned Message */}
        {pinnedMessage && (
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Pinned Message
            </h3>
            <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/50">
              <p className="text-xs font-semibold text-indigo-700 mb-1">{pinnedMessage.sender.name}</p>
              <p className="text-sm text-slate-700 line-clamp-3">{pinnedMessage.content}</p>
            </div>
          </section>
        )}

        {/* Starred Messages */}
        {starredMessages.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Starred Messages
            </h3>
            <div className="space-y-3">
              {starredMessages.map(msg => (
                <div key={msg.id} className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 cursor-pointer hover:border-amber-200 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-slate-800">{msg.senderId === currentUser.id ? "You" : otherUser.name}</span>
                    <span className="text-[10px] text-slate-400">{format(new Date(msg.createdAt), "MMM d")}</span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{msg.content}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
