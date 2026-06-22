"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function ChatWithInfluencerButton({ influencerUserId }: { influencerUserId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChat = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId: influencerUserId, type: "INFLUENCER" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to start chat");
      }

      toast.success("Redirecting to chat...");
      router.push(`/dashboard/messages/${data.conversationId}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to start chat");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleChat}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-indigo-600 text-indigo-600 font-bold rounded-xl shadow-sm hover:bg-indigo-50 transition-colors disabled:opacity-50"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      {loading ? "Starting..." : "Chat With Influencer"}
    </button>
  );
}
