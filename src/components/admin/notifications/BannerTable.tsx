"use client";

import { useState } from "react";
import { format } from "date-fns";
import BannerForm from "./BannerForm";

export default function BannerTable({ initialBanners }: { initialBanners: any[] }) {
  const [banners, setBanners] = useState(initialBanners);
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <h4 className="font-semibold text-slate-700">Active Banners</h4>
        <button
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Create Banner
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Message</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Created At</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {banners.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  No banners found. Create one to display on the homepage.
                </td>
              </tr>
            ) : (
              banners.map((banner) => (
                <tr key={banner.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-medium text-slate-900">{banner.title}</td>
                  <td className="px-6 py-4 text-slate-500">{banner.message}</td>
                  <td className="px-6 py-4 text-slate-500">
                    {banner.targetState ? (
                      <span className="flex flex-col gap-0.5">
                        <span className="text-xs text-slate-400">
                          {banner.targetCity || "Any City"}, {banner.targetState}
                        </span>
                      </span>
                    ) : "All Users"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        banner.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {banner.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {format(new Date(banner.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={async () => {
                        if (confirm("Are you sure you want to delete this banner?")) {
                          const res = await fetch(`/api/admin/banners/${banner.id}`, { method: "DELETE" });
                          if (res.ok) {
                            setBanners(prev => prev.filter(b => b.id !== banner.id));
                          }
                        }
                      }}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <BannerForm 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={(newBanner) => {
            // Because only 1 can be active, update local state
            if (newBanner.isActive) {
              setBanners(prev => [newBanner, ...prev.map(b => ({ ...b, isActive: false }))]);
            } else {
              setBanners(prev => [newBanner, ...prev]);
            }
            setIsFormOpen(false);
          }} 
        />
      )}
    </div>
  );
}
