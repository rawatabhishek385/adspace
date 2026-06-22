"use client";

import { useState, useEffect, useRef, use, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import MessageInput, { SendMessageData } from "@/components/messages/MessageInput";
import ReviewModal from "@/components/reviews/ReviewModal";
import ConversationListingHeader from "@/components/messages/ConversationListingHeader";
import ReportUserModal from "@/components/reports/ReportUserModal";
import TypingIndicator from "@/components/messages/TypingIndicator";
import { getSocket } from "@/lib/socket";
import ImageMessage from "@/components/messages/ImageMessage";
import FileMessage from "@/components/messages/FileMessage";
import DateSeparator from "@/components/messages/DateSeparator";
import SearchMessages from "@/components/messages/SearchMessages";
import MessageReactionBar from "@/components/messages/MessageReactionBar";
import ReplyPreview from "@/components/messages/ReplyPreview";
import DetailsPane from "@/components/messages/DetailsPane";
import ForwardModal from "@/components/messages/ForwardModal";
import { motion, AnimatePresence } from "framer-motion";
import { playNotificationSound } from "@/lib/audio";
type Message = {
  id: string;
  content: string;
  messageType?: "TEXT" | "IMAGE" | "FILE";
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isDeleted?: boolean;
  isStarred?: boolean;
  replyToId?: string;
  replyTo?: { id: string; content: string; senderId: string; messageType: string; fileName?: string; isDeleted?: boolean } | null;
  reactions?: { id: string; emoji: string; userId: string }[];
  createdAt: string;
  isRead: boolean;
  isDelivered?: boolean;
  senderId: string;
};

type Conversation = {
  id: string;
  subject: string | null;
  type: "LISTING" | "CAMPAIGN" | "INFLUENCER";
  status: "ACTIVE" | "CLOSED";
  pinnedMessageId?: string | null;
  listing: { 
    id: string; 
    title: string; 
    isActive: boolean;
    city: string;
    country: string;
    price: number;
    pricePeriod: string;
    media: { url: string; type: string }[];
  } | null;
  campaign?: {
    id: string;
    title: string;
  } | null;
  buyer: { id: string; name: string; avatar?: string | null };
  owner: { id: string; name: string; avatar?: string | null };
  hasReviewed?: boolean;
  hasReport?: boolean;
  pinnedMessage?: Message | null;
};

export default function ChatPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const resolvedParams = use(params);
  const conversationId = resolvedParams.conversationId;
  const { data: session } = useSession();
  const router = useRouter();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "reconnecting" | "offline">("connecting");
  
  // Rich Messaging States
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [reactingToMessageId, setReactingToMessageId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  
  const [otherUserPresence, setOtherUserPresence] = useState<{ isOnline: boolean; lastSeen?: string | null }>({ isOnline: false });
  
  // New features
  const [forwardMessageData, setForwardMessageData] = useState<Message | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages/${conversationId}`);
      if (!res.ok) {
        if (res.status === 403 || res.status === 401) {
          router.push("/dashboard/messages");
          return;
        }
        throw new Error("Failed to load messages");
      }
      const data = await res.json();
      setConversation(data.conversation);
      
      setMessages((prev) => {
        if (prev.length !== data.messages.length) {
          setTimeout(scrollToBottom, 100);
          return data.messages;
        }
        return data.messages; // update anyway for reactions/deletions
      });

      if (data.messages.some((m: Message) => !m.isRead && m.senderId !== session?.user?.id)) {
        await fetch(`/api/messages/${conversationId}`, { method: "PATCH" });
        const socket = getSocket();
        if (socket && session?.user?.id) {
          socket.emit("markAsRead", { conversationId, readerId: session.user.id });
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [conversationId, router, session?.user?.id]);

  useEffect(() => {
    if (session?.user) {
      fetchMessages();
    }
  }, [conversationId, session, fetchMessages]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !session?.user?.id) return;

    socket.on("connect", () => setConnectionStatus("connected"));
    socket.on("disconnect", () => setConnectionStatus("offline"));
    socket.io.on("reconnect_attempt", () => setConnectionStatus("reconnecting"));

    socket.emit("joinConversation", conversationId);
    setConnectionStatus(socket.connected ? "connected" : "connecting");

    const handleReceiveMessage = (newMessage: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMessage.id)) return prev;
        const updated = [...prev, newMessage];
        setTimeout(scrollToBottom, 50);
        return updated;
      });

      if (newMessage.senderId !== session.user.id) {
        socket.emit("markAsRead", { conversationId, readerId: session.user.id });
        fetch(`/api/messages/${conversationId}`, { method: "PATCH" }).catch(() => {});
        playNotificationSound();
        
        // Browser notification if tab is hidden
        if (document.hidden && Notification.permission === "granted") {
          new Notification(`New message from ${newMessage.senderId}`, {
            body: newMessage.content || (newMessage.messageType === "IMAGE" ? "Sent an image" : "Sent a file"),
            icon: "/favicon.ico"
          });
        }
      }
    };

    const handleMessageSentAck = ({ tempId, message }: { tempId: string; message: Message }) => {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? message : m)));
    };

    const handleMessagesRead = ({ readBy }: { readBy: string }) => {
      if (readBy !== session.user.id) {
        setMessages((prev) =>
          prev.map((m) => (m.senderId === session.user.id ? { ...m, isRead: true, isDelivered: true } : m))
        );
      }
    };

    const handleUserTyping = ({ name }: { name: string }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.add(name);
        setTimeout(scrollToBottom, 50);
        return next;
      });
    };

    const handleUserStoppedTyping = ({ name }: { name: string }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(name);
        return next;
      });
    };

    const handleMessageDeleted = ({ messageId }: { messageId: string }) => {
      setMessages((prev) => prev.map(m => m.id === messageId ? { ...m, isDeleted: true } : m));
    };

    const handleMessageReaction = ({ messageId, reactions }: { messageId: string, reactions: any[] }) => {
      setMessages((prev) => prev.map(m => m.id === messageId ? { ...m, reactions } : m));
    };

    const handleMessageStarred = ({ messageId, isStarred }: { messageId: string, isStarred: boolean }) => {
      setMessages((prev) => prev.map(m => m.id === messageId ? { ...m, isStarred } : m));
    };

    const handleMessagePinned = ({ messageId, pinnedMessage }: { messageId: string | null, pinnedMessage: Message | null }) => {
      setConversation(prev => prev ? { ...prev, pinnedMessageId: messageId, pinnedMessage } : null);
    };

    const handlePresenceUpdate = (data: { userId: string; isOnline: boolean; lastSeen?: string }) => {
      setOtherUserPresence(prev => {
        // If we don't have the conversation yet, we don't know the other user id, but we update if it's the right person when it loads
        return { isOnline: data.isOnline, lastSeen: data.lastSeen };
      });
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("messageSentAck", handleMessageSentAck);
    socket.on("messagesRead", handleMessagesRead);
    socket.on("userTyping", handleUserTyping);
    socket.on("userStoppedTyping", handleUserStoppedTyping);
    socket.on("messageDeleted", handleMessageDeleted);
    socket.on("messageReaction", handleMessageReaction);
    socket.on("messageStarred", handleMessageStarred);
    socket.on("messagePinned", handleMessagePinned);
    socket.on("presenceUpdate", handlePresenceUpdate);

    return () => {
      socket.emit("leaveConversation", conversationId);
      socket.off("connect");
      socket.off("disconnect");
      socket.io.off("reconnect_attempt");
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("messageSentAck", handleMessageSentAck);
      socket.off("messagesRead", handleMessagesRead);
      socket.off("userTyping", handleUserTyping);
      socket.off("userStoppedTyping", handleUserStoppedTyping);
      socket.off("messageDeleted", handleMessageDeleted);
      socket.off("messageReaction", handleMessageReaction);
      socket.off("messageStarred", handleMessageStarred);
      socket.off("messagePinned", handleMessagePinned);
      socket.off("presenceUpdate", handlePresenceUpdate);
    };
  }, [conversationId, session?.user?.id]);

  // Request presence when conversation loads
  useEffect(() => {
    const socket = getSocket();
    if (socket && conversation && session?.user?.id) {
      const otherUserId = conversation.buyer.id === session.user.id ? conversation.owner.id : conversation.buyer.id;
      socket.emit("checkPresence", otherUserId);
    }
  }, [conversation, session?.user?.id]);

  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const lowerQuery = searchQuery.toLowerCase();
    const results = messages
      .map((m, idx) => (!m.isDeleted && m.messageType === "TEXT" && m.content.toLowerCase().includes(lowerQuery) ? idx : -1))
      .filter(idx => idx !== -1);
    
    setSearchResults(results);
    if (results.length > 0) {
      setCurrentResultIndex(results.length - 1); // Start at most recent
      scrollToMessageIndex(results[results.length - 1]);
    }
  }, [searchQuery, messages]);

  const scrollToMessageIndex = (index: number) => {
    const msg = messages[index];
    if (msg && messageRefs.current[msg.id]) {
      messageRefs.current[msg.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
      // Temporary highlight effect could be added here
    }
  };

  const handleNextSearchResult = () => {
    if (searchResults.length === 0) return;
    const nextIndex = currentResultIndex < searchResults.length - 1 ? currentResultIndex + 1 : 0;
    setCurrentResultIndex(nextIndex);
    scrollToMessageIndex(searchResults[nextIndex]);
  };

  const handlePrevSearchResult = () => {
    if (searchResults.length === 0) return;
    const prevIndex = currentResultIndex > 0 ? currentResultIndex - 1 : searchResults.length - 1;
      setCurrentResultIndex(prevIndex);
    scrollToMessageIndex(searchResults[prevIndex]);
  };

  const handleSendMessage = async (data: SendMessageData) => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newMsg: Message = {
      id: tempId,
      content: data.content,
      messageType: data.messageType || "TEXT",
      imageUrl: data.imageUrl,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      replyToId: replyToMessage?.id,
      replyTo: replyToMessage ? { 
        id: replyToMessage.id, 
        content: replyToMessage.content, 
        senderId: replyToMessage.senderId,
        messageType: replyToMessage.messageType || "TEXT",
        fileName: replyToMessage.fileName,
        isDeleted: replyToMessage.isDeleted
      } : null,
      createdAt: new Date().toISOString(),
      isRead: false,
      senderId: session!.user.id,
    };
    
    setMessages((prev) => [...prev, newMsg]);
    setTimeout(scrollToBottom, 50);

    const fallbackToHttp = async () => {
      try {
        const res = await fetch(`/api/messages/${conversationId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...data, replyToId: replyToMessage?.id }),
        });
        if (res.ok) {
          const savedMsg = await res.json();
          setMessages((prev) => prev.map((m) => (m.id === tempId ? savedMsg : m)));
        } else {
          setMessages((prev) => prev.filter((m) => m.id !== tempId));
          setError("Failed to send message via API");
        }
      } catch (err) {
        console.error("Failed to send message via HTTP", err);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setError("Failed to send message via API");
      }
    };

    const socket = getSocket();
    if (socket && socket.connected) {
      let ackReceived = false;
      
      const onAck = ({ tempId: ackTempId, message }: any) => {
        if (ackTempId === tempId) {
          ackReceived = true;
          socket.off("messageSentAck", onAck);
        }
      };
      socket.on("messageSentAck", onAck);

      socket.emit("sendMessage", { 
        conversationId, 
        senderId: session!.user.id, 
        tempId,
        ...data,
        replyToId: replyToMessage?.id
      });
      socket.emit("stopTyping", { conversationId, userId: session!.user.id });

      setTimeout(() => {
        if (!ackReceived) {
          console.warn("Socket ack timeout, falling back to HTTP");
          socket.off("messageSentAck", onAck);
          fallbackToHttp();
        }
      }, 3000);
    } else {
      await fallbackToHttp();
    }
    
    setReplyToMessage(null);
  };

  const handleDeleteMessage = (messageId: string) => {
    const socket = getSocket();
    if (socket && session?.user) {
      socket.emit("deleteMessage", { messageId, conversationId, userId: session.user.id });
    }
  };

  const handleReactMessage = (messageId: string, emoji: string) => {
    const socket = getSocket();
    if (socket && session?.user) {
      socket.emit("reactMessage", { messageId, conversationId, userId: session.user.id, emoji });
    }
  };

  const handleTyping = () => {
    const socket = getSocket();
    if (socket && session?.user) {
      socket.emit("typing", { conversationId, userId: session.user.id, name: session.user.name });
    }
  };

  const handleStopTyping = () => {
    const socket = getSocket();
    if (socket && session?.user) {
      socket.emit("stopTyping", { conversationId, userId: session.user.id, name: session.user.name });
    }
  };

  const handleStarMessage = (messageId: string) => {
    const socket = getSocket();
    if (socket && session?.user) {
      socket.emit("starMessage", { messageId, conversationId, userId: session.user.id });
    }
  };

  const handlePinMessage = (messageId: string | null) => {
    const socket = getSocket();
    if (socket && session?.user) {
      socket.emit("pinMessage", { messageId, conversationId, userId: session.user.id });
    }
  };

  const handleForwardClick = (message: Message) => {
    setForwardMessageData(message);
  };

  const handleForwardConfirm = (targetConversationId: string) => {
    const socket = getSocket();
    if (socket && session?.user && forwardMessageData) {
      socket.emit("forwardMessage", {
        targetConversationId,
        senderId: session.user.id,
        content: forwardMessageData.content,
        messageType: forwardMessageData.messageType,
        imageUrl: forwardMessageData.imageUrl,
        fileUrl: forwardMessageData.fileUrl,
        fileName: forwardMessageData.fileName,
        fileSize: forwardMessageData.fileSize,
        tempId: `temp-${Date.now()}`
      });
    }
    setForwardMessageData(null);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <svg className="w-8 h-8 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 flex-col gap-4">
        <p>{error || "Conversation not found"}</p>
        <Link href="/dashboard/messages" className="px-4 py-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
          Return to Inbox
        </Link>
      </div>
    );
  }

  const isOwner = session?.user?.id === conversation.owner.id;
  const otherUser = isOwner ? conversation.buyer : conversation.owner;
  const canReview = messages.length >= 2 && !conversation.hasReviewed;

  return (
    <div className="flex h-full w-full bg-white relative overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative min-w-0 bg-slate-50/50">
        {isSearchOpen && (
          <SearchMessages 
            onSearch={setSearchQuery} 
            onClose={() => {
              setIsSearchOpen(false);
              setSearchQuery("");
              setSearchResults([]);
            }}
            resultCount={searchResults.length}
            currentResultIndex={currentResultIndex}
            onNextResult={handleNextSearchResult}
            onPrevResult={handlePrevSearchResult}
          />
        )}

        {/* Header */}
        <div className="p-3 border-b border-slate-200/60 bg-white/80 backdrop-blur-md shrink-0 flex items-center justify-between z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/messages" className="md:hidden text-slate-500 hover:text-slate-800 mr-1">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <Link href={`/profile/${otherUser.id}`} className="block w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold overflow-hidden hover:opacity-80 transition-opacity shrink-0 ring-2 ring-white shadow-sm">
              {otherUser.avatar ? (
                <Image src={otherUser.avatar} alt={otherUser.name} width={40} height={40} className="w-full h-full object-cover" />
              ) : (
                otherUser.name[0]
              )}
            </Link>
            <div className="min-w-0">
              <Link href={`/profile/${otherUser.id}`} className="font-bold text-slate-800 leading-tight hover:text-indigo-600 transition-colors block truncate">
                {otherUser.name}
              </Link>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-medium ${otherUserPresence.isOnline ? "text-indigo-600" : "text-slate-400"}`}>
                  {otherUserPresence.isOnline ? "Online" : otherUserPresence.lastSeen ? `Seen ${formatDistanceToNow(new Date(otherUserPresence.lastSeen), { addSuffix: true })}` : "Offline"}
                </span>
                <span className="text-slate-300 text-[10px]">•</span>
                {conversation.type === "INFLUENCER" ? (
                  <span className="text-[11px] text-purple-600 font-medium truncate block">Influencer Collaboration</span>
                ) : conversation.listing ? (
                  <Link href={`/listings/${conversation.listing.id}`} className="text-[11px] text-slate-500 hover:text-indigo-600 hover:underline truncate block">
                    {conversation.subject || conversation.listing.title}
                  </Link>
                ) : conversation.campaign ? (
                  <Link href={`/dashboard/campaigns/${conversation.campaign.id}`} className="text-[11px] text-slate-500 hover:text-indigo-600 hover:underline truncate block">
                    {conversation.subject || conversation.campaign.title}
                  </Link>
                ) : (
                  <span className="text-[11px] text-slate-500 truncate block">
                    {conversation.subject}
                  </span>
                )}
                {connectionStatus !== "connected" && (
                  <>
                    <span className="text-slate-300 text-[10px]">•</span>
                    <span className={`text-[10px] font-medium capitalize ${
                      connectionStatus === "connecting" ? "text-amber-500" : "text-red-500"
                    }`}>
                      {connectionStatus}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
            title="Search messages"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {canReview && (
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-colors hidden sm:block shadow-sm"
            >
              Review
            </button>
          )}
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            title={`Report ${otherUser.name}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </button>
          {conversation.status === "CLOSED" && (
            <span className="px-3 py-1 text-[10px] font-bold tracking-wider uppercase bg-red-500 text-white rounded-full shadow-sm">
              CLOSED
            </span>
          )}
        </div>
      </div>

      {conversation.listing && <ConversationListingHeader listing={conversation.listing} />}
      {conversation.campaign && (
        <div className="bg-indigo-50 border-b border-indigo-100 p-3 px-4 flex items-center justify-between text-sm shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Campaign Request: {conversation.campaign.title}</p>
              <p className="text-indigo-600 font-medium text-xs">Active Collaboration</p>
            </div>
          </div>
          <Link href={`/dashboard/campaigns/${conversation.campaign.id}`} className="px-4 py-1.5 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-medium rounded-lg transition-colors">
            View Details
          </Link>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin" ref={containerRef}>
        <div className="text-center bg-yellow-50/80 border border-yellow-200/50 rounded-lg p-3 text-xs text-yellow-800 mx-auto max-w-sm mb-6 shadow-sm">
          <p>🔒 Messages are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.</p>
        </div>

        {messages.map((msg, idx) => {
          const isMine = msg.senderId === session?.user?.id;
          const showDateSeparator = idx === 0 || new Date(msg.createdAt).toDateString() !== new Date(messages[idx - 1].createdAt).toDateString();
          const isHighlighted = searchResults.includes(idx) && searchQuery;

          // Reaction grouping
          const reactionCounts: Record<string, number> = {};
          msg.reactions?.forEach(r => {
            reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
          });

          return (
            <div key={msg.id} className="w-full">
              {showDateSeparator && <DateSeparator date={new Date(msg.createdAt)} />}

              <div 
                ref={(el) => { messageRefs.current[msg.id] = el; }}
                className={`flex flex-col group relative ${isMine ? "items-end" : "items-start"} mt-3 mb-1`}
              >
                {/* Message Hover Actions */}
                <div className={`absolute top-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 -mt-10 bg-white/90 backdrop-blur-md shadow-md border border-slate-200/50 rounded-full px-2 py-1 ${isMine ? "right-0" : "left-0"}`}>
                  <button onClick={() => setReactingToMessageId(msg.id)} className="text-slate-400 hover:text-indigo-500 p-1.5 rounded-full hover:bg-slate-100 transition-colors" title="React">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </button>
                  <button onClick={() => setReplyToMessage(msg)} className="text-slate-400 hover:text-indigo-500 p-1.5 rounded-full hover:bg-slate-100 transition-colors" title="Reply">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                  </button>
                  <button onClick={() => handleStarMessage(msg.id)} className={`${msg.isStarred ? 'text-amber-400' : 'text-slate-400 hover:text-amber-400'} p-1.5 rounded-full hover:bg-slate-100 transition-colors`} title="Star">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  </button>
                  <button onClick={() => handlePinMessage(conversation.pinnedMessageId === msg.id ? null : msg.id)} className={`${conversation.pinnedMessageId === msg.id ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-600'} p-1.5 rounded-full hover:bg-slate-100 transition-colors`} title={conversation.pinnedMessageId === msg.id ? "Unpin" : "Pin"}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                  </button>
                  <button onClick={() => handleForwardClick(msg)} className="text-slate-400 hover:text-indigo-500 p-1.5 rounded-full hover:bg-slate-100 transition-colors" title="Forward">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                  {isMine && (
                    <button onClick={() => handleDeleteMessage(msg.id)} className="text-slate-400 hover:text-red-500 p-1.5 rounded-full hover:bg-slate-100 transition-colors" title="Delete">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
                </div>

                {reactingToMessageId === msg.id && (
                  <MessageReactionBar 
                    onReact={(emoji) => handleReactMessage(msg.id, emoji)} 
                    position={isMine ? "right" : "left"} 
                    onClose={() => setReactingToMessageId(null)} 
                  />
                )}

                <div
                  className={`relative max-w-[85%] sm:max-w-[75%] rounded-2xl p-1 shadow-sm transition-all ${
                    isMine
                      ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white"
                      : "bg-white text-slate-800 border border-slate-100"
                  } ${isHighlighted ? 'ring-4 ring-amber-400/50 ring-offset-2' : ''}`}
                >
                  {msg.isDeleted ? (
                    <div className="px-3 py-2 text-slate-400 italic text-sm flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      This message was deleted
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {msg.replyTo && (
                        <div className="mb-1">
                          <ReplyPreview 
                            content={msg.replyTo.content} 
                            senderName={msg.replyTo.senderId === session?.user?.id ? "You" : otherUser.name} 
                            messageType={msg.replyTo.messageType as any}
                            fileName={msg.replyTo.fileName}
                            isDeleted={msg.replyTo.isDeleted}
                          />
                        </div>
                      )}

                      {msg.messageType === "IMAGE" && msg.imageUrl && (
                        <div className="p-0.5">
                          <ImageMessage 
                            url={msg.imageUrl} 
                            allImages={messages.filter(m => m.messageType === "IMAGE" && m.imageUrl).map(m => m.imageUrl!)}
                          />
                        </div>
                      )}

                      {msg.messageType === "FILE" && msg.fileUrl && (
                        <div className="mb-1">
                          <FileMessage url={msg.fileUrl} name={msg.fileName!} size={msg.fileSize} isMine={isMine} />
                        </div>
                      )}

                      {(msg.content || msg.messageType === "TEXT") && (
                        <div className="px-3 py-1.5 pb-6 relative">
                          <p className={`text-[15px] whitespace-pre-wrap break-words leading-relaxed ${isMine ? "font-medium" : "font-normal"}`}>
                            {isHighlighted && searchQuery ? (
                              msg.content.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, i) => 
                                part.toLowerCase() === searchQuery.toLowerCase() ? <mark key={i} className="bg-amber-200 text-slate-800 rounded px-0.5">{part}</mark> : part
                              )
                            ) : msg.content}
                          </p>
                        </div>
                      )}

                      {/* Time and Ticks (absolute positioned at bottom right of bubble) */}
                      <div className={`absolute bottom-1 right-2 flex items-center gap-1 text-[10px] select-none bg-inherit pl-2 rounded-tl-lg ${isMine ? 'text-indigo-200' : 'text-slate-400'}`}>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMine && (
                          <span className={msg.isRead ? "text-sky-300" : "text-indigo-200/70"}>
                            {msg.id.startsWith("temp-") ? (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : msg.isRead ? (
                              <span className="flex">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7M5 13l4 4L19 7" style={{ transform: 'translateX(-4px)' }} />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" style={{ transform: 'translateX(2px)' }} />
                                </svg>
                              </span>
                            ) : msg.isDelivered ? (
                              <span className="flex">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7M5 13l4 4L19 7" style={{ transform: 'translateX(-4px)' }} />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" style={{ transform: 'translateX(2px)' }} />
                                </svg>
                              </span>
                            ) : (
                              <span className="flex">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Reactions Badge */}
                  {Object.keys(reactionCounts).length > 0 && (
                    <div className={`absolute -bottom-3 flex items-center gap-1 bg-white border border-slate-200 rounded-full px-1.5 py-0.5 shadow-sm text-xs ${isMine ? "right-2" : "left-2"}`}>
                      {Object.entries(reactionCounts).map(([emoji, count]) => (
                        <span key={emoji} className="flex items-center gap-0.5">
                          {emoji} {count > 1 && <span className="text-[10px] text-slate-500 font-medium">{count}</span>}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {Array.from(typingUsers).map((name) => (
          <TypingIndicator key={name} name={name} />
        ))}
        
        <div ref={messagesEndRef} className="h-4" />
      </div>

      <MessageInput 
        onSend={handleSendMessage} 
        onTyping={handleTyping}
        onStopTyping={handleStopTyping}
        disabled={conversation.status === "CLOSED" || Boolean(conversation.listing && !conversation.listing.isActive)} 
        blockedMessage={
          conversation.hasReport ? "You reported this user. The chat is blocked."
          : (conversation.listing && !conversation.listing.isActive) ? "This listing is no longer active."
          : "This conversation is closed."
        }
        replyTo={replyToMessage ? { 
          id: replyToMessage.id, 
          content: replyToMessage.content, 
          senderName: replyToMessage.senderId === session?.user?.id ? "You" : otherUser.name,
          messageType: replyToMessage.messageType || "TEXT",
          fileName: replyToMessage.fileName,
          isDeleted: replyToMessage.isDeleted
        } : null}
        onCancelReply={() => setReplyToMessage(null)}
      />

        <ReviewModal isOpen={isReviewModalOpen} onClose={() => { setIsReviewModalOpen(false); fetchMessages(); }} revieweeId={otherUser.id} conversationId={conversation.id} />
        <ReportUserModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} reportedUserId={otherUser.id} reportedUserName={otherUser.name} conversationId={conversation.id} />
      </div>

      {/* Right Sidebar - Details Pane */}
      <div className="hidden xl:block w-[280px] shrink-0 bg-slate-50/50 border-l border-slate-200">
        <DetailsPane 
          conversation={conversation} 
          currentUser={session?.user} 
          pinnedMessage={conversation.pinnedMessage} 
          starredMessages={messages.filter(m => m.isStarred)}
          isOnline={otherUserPresence.isOnline}
          lastSeen={otherUserPresence.lastSeen}
        />
      </div>

      <ForwardModal 
        isOpen={!!forwardMessageData}
        onClose={() => setForwardMessageData(null)}
        messageToForward={forwardMessageData}
        currentUserId={session?.user?.id || ""}
        onForward={handleForwardConfirm}
      />
    </div>
  );
}
