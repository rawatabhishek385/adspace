"use client";

import { useState } from "react";
import CampaignRequestModal from "./CampaignRequestModal";

type CampaignRequestCTAProps = {
  influencerId: string;
  influencerType: "INDIVIDUAL" | "DIGITAL_MARKETER";
  influencerName: string;
};

export default function CampaignRequestCTA({ influencerId, influencerType, influencerName }: CampaignRequestCTAProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="mb-6 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all inline-flex items-center justify-center w-full gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Request Campaign
      </button>

      <CampaignRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        influencerId={influencerId}
        influencerType={influencerType}
        influencerName={influencerName}
      />
    </>
  );
}
