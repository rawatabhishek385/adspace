"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional().nullable(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  website: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || /^https?:\/\//.test(val), {
      message: "Website must be a valid URL starting with http:// or https://",
    }),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileForm({ user }: { user: { name: string; email: string; phone?: string | null; bio?: string | null; city?: string | null; state?: string | null; country?: string | null; website?: string | null; avatar?: string | null; } }) {
  const router = useRouter();
  const { update } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
      bio: user?.bio || "",
      city: user?.city || "",
      state: user?.state || "",
      country: user?.country || "",
      website: user?.website || "",
    },
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("files", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setAvatarUrl(data.data[0].url);
      } else {
        setError("Failed to upload avatar");
      }
    } catch {
      setError("An error occurred while uploading");
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = { ...data, avatar: avatarUrl };
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        setError(result.message || "Failed to update profile");
        return;
      }

      await update({ avatar: avatarUrl });
      window.dispatchEvent(new Event('profileUpdated'));
      router.refresh();
      alert("Profile updated successfully!");
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all";
  const labelClass = "block text-sm font-medium text-slate-600 mb-1.5";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}

      <div className="flex items-center gap-6">
        <div className="relative w-24 h-24 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
          ) : (
            <span className="text-3xl font-semibold text-slate-500">{user?.name?.charAt(0).toUpperCase()}</span>
          )}
          {isUploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span></div>}
        </div>
        <div>
          <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            {isUploading ? "Uploading..." : "Change Avatar"}
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploading} />
          </label>
          <p className="text-xs text-slate-500 mt-2">Recommended: Square image, max 2MB</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>Name</label>
          <input type="text" {...register("name")} className={inputClass} />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Email (Read-only)</label>
          <input type="email" value={user.email} disabled className={`${inputClass} opacity-50 cursor-not-allowed`} />
        </div>
        <div>
          <label className={labelClass}>Phone</label>
          <input type="tel" {...register("phone")} className={inputClass} />
          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
        </div>
        <div>
          <label className={labelClass}>City</label>
          <input type="text" {...register("city")} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>State</label>
          <input type="text" {...register("state")} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Country</label>
          <input type="text" {...register("country")} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Website</label>
        <input type="url" placeholder="https://example.com" {...register("website")} className={inputClass} />
        {errors.website && <p className="text-xs text-red-500 mt-1">{errors.website.message}</p>}
      </div>

      <div>
        <label className={labelClass}>Services Offered</label>
        <textarea {...register("bio")} rows={4} className={inputClass} placeholder="List the services you offer..."></textarea>
        {errors.bio && <p className="text-xs text-red-500 mt-1">{errors.bio.message}</p>}
      </div>

      <button type="submit" disabled={isSubmitting || isUploading} className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2.5 px-6 rounded-lg transition-colors disabled:opacity-50">
        {isSubmitting ? "Saving..." : "Save Profile"}
      </button>
    </form>
  );
}
