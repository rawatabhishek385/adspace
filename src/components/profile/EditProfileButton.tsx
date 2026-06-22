"use client";

import { useState } from "react";
import EditInfluencerProfileModal from "./EditInfluencerProfileModal";

export default function EditProfileButton({ influencerProfile }: { influencerProfile: any }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="mb-6 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors inline-block w-full"
      >
        Edit Profile
      </button>

      {influencerProfile && (
        <EditInfluencerProfileModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          influencerProfile={influencerProfile}
        />
      )}
    </>
  );
}
