"use client";

import { useState } from "react";
import Link from "next/link";

interface AdminListing {
  id: string;
  title: string;
  slug: string;
  city: string;
  price: number;
  pricePeriod: string;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  owner: { id: string; name: string; email: string };
  category: { id: string; name: string };
  media: { id: string; url: string; type: string }[];
  _count: { reports: number };
}

interface Props {
  initialListings: AdminListing[];
}

export function ListingModerationTable({ initialListings }: Props) {
  const [listings, setListings] = useState<AdminListing[]>(initialListings);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive" | "featured">("all");
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const apiPatch = async (id: string, body: object, optimisticUpdate: (l: AdminListing) => AdminListing) => {
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.message, "error"); return; }
      setListings((prev) => prev.map((l) => (l.id === id ? optimisticUpdate(l) : l)));
      showToast("Updated successfully");
    } catch {
      showToast("Action failed", "error");
    } finally {
      setLoading(null);
    }
  };

  const deleteListing = async (id: string, title: string) => {
    if (!confirm(`Permanently delete "${title}"? This will also remove all Cloudinary assets.`)) return;
    setLoading(id);
    try {
      const res = await fetch(`/api/admin/listings/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) { showToast(data.message, "error"); return; }
      setListings((prev) => prev.filter((l) => l.id !== id));
      showToast("Listing deleted");
    } catch {
      showToast("Delete failed", "error");
    } finally {
      setLoading(null);
    }
  };

  const filtered = listings.filter((l) => {
    const matchesSearch =
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.city.toLowerCase().includes(search.toLowerCase()) ||
      l.owner.name.toLowerCase().includes(search.toLowerCase()) ||
      l.owner.email.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "active" && l.isActive) ||
      (filter === "inactive" && !l.isActive) ||
      (filter === "featured" && l.isFeatured);

    return matchesSearch && matchesFilter;
  });

  const formatPrice = (price: number, period: string) =>
    `₹${price.toLocaleString("en-IN")}/${period}`;

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg transition-all ${
          toast.type === "success"
            ? "bg-blue-100 border border-blue-500/40 text-blue-300"
            : "bg-red-500/20 border border-red-500/40 text-red-300"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total", val: listings.length, color: "text-slate-800" },
          { label: "Active", val: listings.filter((l) => l.isActive).length, color: "text-blue-500" },
          { label: "Disabled", val: listings.filter((l) => !l.isActive).length, color: "text-red-500" },
          { label: "Featured", val: listings.filter((l) => l.isFeatured).length, color: "text-amber-500" },
        ].map((s) => (
          <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search title, city, or owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "inactive", "featured"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? "bg-blue-500 text-white"
                  : "bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-white/[0.02]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Listing</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Owner</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Price</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Reports</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    No listings match your criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((listing) => (
                  <tr
                    key={listing.id}
                    className={`hover:bg-white/[0.02] transition-colors ${loading === listing.id ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    <td className="px-4 py-3 max-w-[220px]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-white shrink-0">
                          {listing.media[0] ? (
                            <img src={listing.media[0].url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/listings/${listing.slug}`}
                            target="_blank"
                            className="text-slate-700 font-medium text-sm hover:text-blue-500 transition-colors line-clamp-1"
                          >
                            {listing.title}
                          </Link>
                          <p className="text-slate-500 text-xs">{listing.city}</p>
                          {listing.isFeatured && (
                            <span className="inline-block mt-0.5 text-[10px] bg-amber-100 text-amber-500 px-1.5 py-0.5 rounded-full">⭐ Featured</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-600 text-sm truncate max-w-[130px]">{listing.owner.name}</p>
                      <p className="text-slate-500 text-xs truncate max-w-[130px]">{listing.owner.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{listing.category.name}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-sm whitespace-nowrap">
                      {formatPrice(listing.price, listing.pricePeriod)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        listing.isActive
                          ? "bg-blue-100 text-blue-500 border border-blue-200"
                          : "bg-red-500/20 text-red-500 border border-red-200"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${listing.isActive ? "bg-blue-400" : "bg-red-400"}`} />
                        {listing.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {listing._count.reports > 0 ? (
                        <span className="text-xs bg-red-500/20 text-red-500 border border-red-200 px-2 py-1 rounded-full font-medium">
                          {listing._count.reports} report{listing._count.reports > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-xs">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Link
                          href={`/listings/${listing.slug}`}
                          target="_blank"
                          className="px-2.5 py-1 text-xs bg-slate-50 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          View
                        </Link>
                        {listing.isActive ? (
                          <button
                            onClick={() => apiPatch(listing.id, { isActive: false }, (l) => ({ ...l, isActive: false }))}
                            className="px-2.5 py-1 text-xs bg-red-50 text-red-500 border border-red-200 rounded-lg hover:bg-red-500/20 transition-colors"
                          >
                            Disable
                          </button>
                        ) : (
                          <button
                            onClick={() => apiPatch(listing.id, { isActive: true }, (l) => ({ ...l, isActive: true }))}
                            className="px-2.5 py-1 text-xs bg-blue-50 text-blue-500 border border-blue-500/20 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            Enable
                          </button>
                        )}
                        {listing.isFeatured ? (
                          <button
                            onClick={() => apiPatch(listing.id, { isFeatured: false }, (l) => ({ ...l, isFeatured: false }))}
                            className="px-2.5 py-1 text-xs bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg hover:bg-amber-100 transition-colors"
                          >
                            Unfeature
                          </button>
                        ) : (
                          <button
                            onClick={() => apiPatch(listing.id, { isFeatured: true }, (l) => ({ ...l, isFeatured: true }))}
                            className="px-2.5 py-1 text-xs bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg hover:bg-amber-100 transition-colors"
                          >
                            ⭐ Feature
                          </button>
                        )}
                        <button
                          onClick={() => deleteListing(listing.id, listing.title)}
                          className="px-2.5 py-1 text-xs bg-red-50 text-red-500 border border-red-200 rounded-lg hover:bg-red-500/20 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
          Showing {filtered.length} of {listings.length} listings
        </div>
      </div>
    </div>
  );
}
