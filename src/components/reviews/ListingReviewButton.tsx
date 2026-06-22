"use client";

import { useState } from "react";
import ListingReviewModal from "./ListingReviewModal";

interface ListingReviewButtonProps {
  listingId: string;
  isOwner: boolean;
  hasEligibleConversation: boolean;
  conversationId?: string | null;
  existingReview?: {
    id: string;
    rating: number;
    comment: string | null;
  } | null;
}

export default function ListingReviewButton({ 
  listingId, 
  isOwner, 
  hasEligibleConversation, 
  conversationId, 
  existingReview 
}: ListingReviewButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Business rules
  if (isOwner) return null; // Owners cannot review their own listings
  if (!hasEligibleConversation || !conversationId) return null; // Must have an eligible conversation (2+ messages)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium rounded-xl border border-slate-200 transition-colors"
      >
        <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        {existingReview ? "Edit Review" : "Leave Listing Review"}
      </button>

      <ListingReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        listingId={listingId}
        conversationId={conversationId}
        existingReview={existingReview}
      />
    </>
  );
}
