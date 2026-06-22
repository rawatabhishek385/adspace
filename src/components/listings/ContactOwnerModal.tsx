"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ContactOwnerModalProps {
  listingId: string;
  ownerId: string;
  listingTitle: string;
  isLoggedIn: boolean;
  currentUserId?: string;
}

export default function ContactOwnerModal({
  listingId,
  ownerId,
  listingTitle,
  isLoggedIn,
  currentUserId,
}: ContactOwnerModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isOwner = currentUserId === ownerId;

  const handleOpen = () => {
    if (!isLoggedIn) {
      router.push(`/login?callbackUrl=/listings/${listingId}`);
      return;
    }
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setMessage("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError("Message cannot be empty");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/messages/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      handleClose();
      router.push(`/dashboard/messages/${data.conversationId}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to send message. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isOwner) {
    return (
      <button
        disabled
        className="block w-full py-3 bg-slate-700 text-slate-500 text-center font-medium rounded-xl cursor-not-allowed"
      >
        This is your listing
      </button>
    );
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="block w-full py-3 bg-blue-500 hover:bg-blue-600 text-white text-center font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/25"
      >
        Contact Owner
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-[95vw] sm:w-[500px] max-w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-slate-800">Contact Owner</h3>
              <button
                onClick={handleClose}
                className="text-slate-500 hover:text-slate-800 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <p className="text-sm text-slate-500 mb-2">Inquiring about:</p>
                <p className="text-slate-700 font-medium bg-slate-50 px-4 py-2 rounded-lg">{listingTitle}</p>
              </div>

              <div className="mb-6">
                <label htmlFor="message" className="block text-sm font-medium text-slate-600 mb-2">
                  Your Message
                </label>
                <textarea
                  id="message"
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hi, I'm interested in renting this space..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  maxLength={1000}
                />
                <div className="flex justify-between mt-2 text-xs text-slate-500">
                  {error ? <span className="text-red-500">{error}</span> : <span />}
                  <span>{message.length} / 1000</span>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-lg shadow-blue-500/25 flex items-center gap-2"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
