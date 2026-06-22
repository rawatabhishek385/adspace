"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";

const editProfileSchema = z.object({
  description: z.string().optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  pricePerPost: z.string().optional(),
  instagramUrl: z.string().optional(),
  youtubeUrl: z.string().optional(),
  twitterUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
  facebookUrl: z.string().optional(),
});

type EditProfileFormData = z.infer<typeof editProfileSchema>;

export default function EditInfluencerProfileModal({ 
  isOpen, 
  onClose, 
  influencerProfile 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  influencerProfile: any 
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(influencerProfile.profileImage || null);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      description: influencerProfile.description || "",
      category: influencerProfile.category || "",
      city: influencerProfile.city || "",
      pricePerPost: influencerProfile.pricePerPost ? String(influencerProfile.pricePerPost) : "",
      instagramUrl: influencerProfile.instagramUrl || "",
      youtubeUrl: influencerProfile.youtubeUrl || "",
      twitterUrl: influencerProfile.twitterUrl || "",
      linkedinUrl: influencerProfile.linkedinUrl || "",
      facebookUrl: influencerProfile.facebookUrl || "",
    },
  });

  const onSubmit = async (data: EditProfileFormData) => {
    setServerError(null);
    try {
      const response = await fetch("/api/influencer/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...data, profileImage: profileImageUrl }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        onClose();
        router.refresh();
      } else {
        setServerError(result.message || "Failed to update profile");
      }
    } catch (error) {
      setServerError("An error occurred while updating your profile");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800">Edit Influencer Profile</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar">
            {serverError && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm">
                {serverError}
              </div>
            )}

            <form id="edit-profile-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Profile Image Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Profile Image</label>
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center shrink-0">
                    {profileImageUrl ? (
                      <Image src={profileImageUrl} alt="Profile" fill className="object-cover" />
                    ) : (
                      <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                    {isUploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span></div>}
                  </div>
                  <div>
                    <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-block">
                      {isUploading ? "Uploading..." : profileImageUrl ? "Change Image" : "Upload Image"}
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setIsUploading(true);
                        setServerError(null);
                        const formData = new FormData();
                        formData.append("files", file);
                        try {
                          const res = await fetch("/api/upload", { method: "POST", body: formData });
                          const data = await res.json();
                          if (data.success && data.data.length > 0) {
                            setProfileImageUrl(data.data[0].url);
                          } else {
                            setServerError("Failed to upload image");
                          }
                        } catch {
                          setServerError("An error occurred while uploading");
                        } finally {
                          setIsUploading(false);
                        }
                      }} disabled={isUploading} />
                    </label>
                    <p className="text-xs text-slate-500 mt-1.5">Recommended: Square image, max 2MB</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    {...register("category")}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    {...register("city")}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Price Per Post (₹)</label>
                <input
                  type="number"
                  {...register("pricePerPost")}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Services Offered</label>
                <textarea
                  rows={4}
                  placeholder="List the services you offer (e.g., Sponsored Posts, Story Mentions, Content Creation)."
                  {...register("description")}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">Social Media Links</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Instagram URL</label>
                    <input type="url" {...register("instagramUrl")} className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">YouTube URL</label>
                    <input type="url" {...register("youtubeUrl")} className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Twitter/X URL</label>
                    <input type="url" {...register("twitterUrl")} className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">LinkedIn URL</label>
                    <input type="url" {...register("linkedinUrl")} className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Facebook URL</label>
                    <input type="url" {...register("facebookUrl")} className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                </div>
              </div>

            </form>
          </div>

          <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              form="edit-profile-form"
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
