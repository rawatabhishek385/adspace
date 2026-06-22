"use client";

import { useState } from "react";
import ReviewModal from "./ReviewModal";

interface ProfileReviewEditButtonProps {
  review: {
    id: string;
    rating: number;
    comment: string | null;
  };
  revieweeId: string;
  conversationId: string;
}

export default function ProfileReviewEditButton({ review, revieweeId, conversationId }: ProfileReviewEditButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="ml-auto px-3 py-1 text-xs font-medium bg-white hover:bg-slate-700 text-slate-600 border border-slate-200 rounded-lg transition-colors"
      >
        Edit Review
      </button>

      <ReviewModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        revieweeId={revieweeId}
        conversationId={conversationId}
        existingReview={review}
      />
    </>
  );
}
