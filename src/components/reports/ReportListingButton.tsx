"use client";

import { useState } from "react";
import ReportListingModal from "./ReportListingModal";

interface ReportListingButtonProps {
  listingId: string;
  isOwner: boolean;
  isLoggedIn: boolean;
}

export default function ReportListingButton({ listingId, isOwner, isLoggedIn }: ReportListingButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isOwner || !isLoggedIn) return null;

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-50 text-red-500 font-medium rounded-xl border border-red-500/10 transition-colors text-sm"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Report Listing
      </button>

      <ReportListingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        listingId={listingId}
      />
    </>
  );
}
