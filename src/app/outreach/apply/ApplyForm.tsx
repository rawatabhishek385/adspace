"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Image from "next/image";

const applySchema = z.object({
  type: z.enum(["INDIVIDUAL", "DIGITAL_MARKETER"]),
  companyName: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  followers: z.string().optional(),
  instagramUrl: z.string().optional(),
  youtubeUrl: z.string().optional(),
  twitterUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
  facebookUrl: z.string().optional(),
}).refine((data) => {
  if (data.type === "DIGITAL_MARKETER" && (!data.companyName || data.companyName.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Company Name is required for Digital Marketers.",
  path: ["companyName"],
});

type ApplyFormData = z.infer<typeof applySchema>;

export default function ApplyForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ApplyFormData>({
    resolver: zodResolver(applySchema),
    defaultValues: {
      type: "INDIVIDUAL",
    },
  });

  const type = watch("type");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const onSubmit = async (data: ApplyFormData) => {
    setServerError(null);
    try {
      const response = await fetch("/api/outreach/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          followers: data.followers ? Number(data.followers) : undefined,
          profileImage: profileImageUrl || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setServerError(result.message || "Something went wrong.");
        return;
      }

      router.refresh();
    } catch (err) {
      setServerError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 shadow-xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {serverError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-500 text-sm">
            {serverError}
          </div>
        )}

        {/* Type Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">Account Type</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="radio"
                value="INDIVIDUAL"
                {...register("type")}
                className="w-4 h-4 text-blue-500 focus:ring-blue-500"
              />
              Individual Creator
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="radio"
                value="DIGITAL_MARKETER"
                {...register("type")}
                className="w-4 h-4 text-blue-500 focus:ring-blue-500"
              />
              Company / Agency
            </label>
          </div>
        </div>

        {/* Company Name */}
        {type === "DIGITAL_MARKETER" && (
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Company Name</label>
            <input
              type="text"
              placeholder="Agency Name LLC"
              {...register("companyName")}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50"
            />
            {errors.companyName && <p className="mt-1 text-xs text-red-500">{errors.companyName.message}</p>}
          </div>
        )}

        {/* Basic Influencer Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Category</label>
            <input
              type="text"
              placeholder="e.g. Tech, Fashion, General"
              {...register("category")}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">City</label>
            <input
              type="text"
              placeholder="e.g. New York"
              {...register("city")}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Total Followers</label>
            <input
              type="number"
              placeholder="10000"
              {...register("followers")}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        {/* Profile Image Upload */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">Profile Image</label>
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
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
              </label>
              <p className="text-xs text-slate-500 mt-1.5">Recommended: Square image, max 2MB</p>
            </div>
          </div>
        </div>

        {/* Services */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1.5">Services Offered</label>
          <textarea
            placeholder="List the services you offer (e.g., Sponsored Posts, Story Mentions, Content Creation)."
            rows={4}
            {...register("description")}
            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        {/* Social Media */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-600">Social Media URLs</label>
          <input type="url" placeholder="Instagram URL" {...register("instagramUrl")} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50" />
          <input type="url" placeholder="YouTube URL" {...register("youtubeUrl")} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50" />
          <input type="url" placeholder="Twitter/X URL" {...register("twitterUrl")} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50" />
          <input type="url" placeholder="LinkedIn URL" {...register("linkedinUrl")} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50" />
          <input type="url" placeholder="Facebook URL" {...register("facebookUrl")} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/50" />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Submitting...
            </>
          ) : (
            "Submit Application"
          )}
        </button>
      </form>
    </div>
  );
}
