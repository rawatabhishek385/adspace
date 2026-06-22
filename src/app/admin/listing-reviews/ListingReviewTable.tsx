"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface Reviewer {
  id: string;
  name: string;
  avatar: string | null;
}

interface Listing {
  id: string;
  title: string;
}

interface ListingReview {
  id: string;
  rating: number;
  comment: string | null;
  isDeleted: boolean;
  createdAt: string;
  reviewer: Reviewer;
  listing: Listing;
}

interface Props {
  initialReviews: ListingReview[];
}

export function ListingReviewTable({ initialReviews }: Props) {
  const [reviews, setReviews] = useState<ListingReview[]>(initialReviews);
  const [search, setSearch] = useState("");
  const [filterRating, setFilterRating] = useState<number | "ALL">("ALL");
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Are you sure you want to soft-delete this listing review?")) return;
    setLoading(id);
    try {
      const res = await fetch(`/api/listing-reviews/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { showToast(data.message, "error"); return; }
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, isDeleted: true } : r)));
      showToast("Listing review deleted");
    } catch {
      showToast("Delete failed", "error");
    } finally {
      setLoading(null);
    }
  };

  const filtered = reviews.filter((r) => {
    const matchesSearch =
      r.reviewer.name.toLowerCase().includes(search.toLowerCase()) ||
      r.listing.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.comment?.toLowerCase() || "").includes(search.toLowerCase());
    const matchesRating = filterRating === "ALL" || r.rating === filterRating;
    return matchesSearch && matchesRating;
  });

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg transition-all ${
          toast.type === "success"
            ? "bg-blue-500/20 border border-blue-500/40 text-blue-300"
            : "bg-red-500/20 border border-red-500/40 text-red-300"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by reviewer, listing, or comment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <select
          value={filterRating}
          onChange={(e) => setFilterRating(e.target.value === "ALL" ? "ALL" : Number(e.target.value))}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <option value="ALL" className="bg-slate-800">All Ratings</option>
          {[5, 4, 3, 2, 1].map(r => (
            <option key={r} value={r} className="bg-slate-800">{r} Stars</option>
          ))}
        </select>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Reviews", val: reviews.length, color: "text-white" },
          { label: "Active", val: reviews.filter((r) => !r.isDeleted).length, color: "text-blue-400" },
          { label: "Deleted", val: reviews.filter((r) => r.isDeleted).length, color: "text-red-400" },
          { label: "Avg Rating", val: (reviews.filter(r => !r.isDeleted).reduce((sum, r) => sum + r.rating, 0) / Math.max(1, reviews.filter(r => !r.isDeleted).length)).toFixed(1), color: "text-amber-400" },
        ].map((s) => (
          <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Reviewer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Listing</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Rating & Comment</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    {search ? "No listing reviews match your search." : "No listing reviews found."}
                  </td>
                </tr>
              ) : (
                filtered.map((review) => (
                  <tr key={review.id} className={`hover:bg-white/[0.02] transition-colors ${loading === review.id ? "opacity-50 pointer-events-none" : ""} ${review.isDeleted ? "opacity-50" : ""}`}>
                    {/* Reviewer */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link href={`/profile/${review.reviewer.id}`} className="block w-9 h-9 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-semibold text-sm shrink-0 overflow-hidden hover:opacity-80">
                          {review.reviewer.avatar ? (
                            <Image src={review.reviewer.avatar} alt={review.reviewer.name} width={36} height={36} className="w-full h-full object-cover" />
                          ) : (
                            review.reviewer.name[0]?.toUpperCase()
                          )}
                        </Link>
                        <Link href={`/profile/${review.reviewer.id}`} className="text-white font-medium truncate hover:text-blue-400 transition-colors block">
                          {review.reviewer.name}
                        </Link>
                      </div>
                    </td>
                    {/* Listing */}
                    <td className="px-4 py-3">
                      <Link href={`/listings/${review.listing.id}`} className="text-slate-300 font-medium truncate hover:text-blue-400 transition-colors block max-w-[200px]">
                        {review.listing.title}
                      </Link>
                    </td>
                    {/* Rating & Comment */}
                    <td className="px-4 py-3 max-w-[300px]">
                      <div className="flex items-center gap-1 text-amber-400 mb-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <svg key={star} className={`w-3 h-3 ${star <= review.rating ? 'text-amber-400' : 'text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-slate-400 text-xs line-clamp-2" title={review.comment || ""}>
                        {review.comment || <span className="italic text-slate-600">No comment</span>}
                      </p>
                    </td>
                    {/* Date */}
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      {!review.isDeleted ? (
                        <button
                          onClick={() => deleteReview(review.id)}
                          className="px-2.5 py-1 text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors"
                        >
                          Delete
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 text-xs bg-slate-500/10 text-slate-500 border border-slate-500/20 rounded-lg">
                          Deleted
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
