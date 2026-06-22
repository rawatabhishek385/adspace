"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface Conversation {
  id: string;
  listing: { title: string; media: { url: string }[] };
  buyer: { id: string; name: string; avatar?: string };
  owner: { id: string; name: string; avatar?: string };
}

interface ForwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageToForward: any;
  currentUserId: string;
  onForward: (targetConversationId: string) => void;
}

export default function ForwardModal({ isOpen, onClose, messageToForward, currentUserId, onForward }: ForwardModalProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetch("/api/conversations")
        .then(res => res.json())
        .then(data => {
          setConversations(data.conversations || []);
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Failed to load conversations", err);
          setIsLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredConversations = conversations.filter(conv => {
    const otherUser = conv.buyer.id === currentUserId ? conv.owner : conv.buyer;
    return otherUser.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           conv.listing.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Forward Message</h3>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="Search conversations..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl text-sm transition-all outline-none"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center p-8 text-slate-500 text-sm">No conversations found</div>
            ) : (
              <div className="space-y-1">
                {filteredConversations.map(conv => {
                  const otherUser = conv.buyer.id === currentUserId ? conv.owner : conv.buyer;
                  return (
                    <button
                      key={conv.id}
                      className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-2xl transition-colors text-left"
                      onClick={() => {
                        onForward(conv.id);
                        onClose();
                      }}
                    >
                      <Image 
                        src={otherUser.avatar || "/placeholder-avatar.jpg"} 
                        alt={otherUser.name} 
                        width={40} 
                        height={40} 
                        className="rounded-full object-cover shrink-0"
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-semibold text-slate-800 text-sm truncate">{otherUser.name}</span>
                        <span className="text-xs text-slate-500 truncate">{conv.listing.title}</span>
                      </div>
                      <span className="shrink-0 text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Send
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
