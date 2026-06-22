"use client";

import { useState } from "react";
import { format } from "date-fns";
import CampaignForm from "./CampaignForm";

export default function CampaignTable({ initialCampaigns }: { initialCampaigns: any[] }) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <h4 className="font-semibold text-slate-700">Campaign History</h4>
        <button
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          New Campaign
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Audience</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-center">Opens</th>
              <th className="px-6 py-4 text-center">Clicks</th>
              <th className="px-6 py-4">Created At</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {campaigns.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                  No campaigns found.
                </td>
              </tr>
            ) : (
              campaigns.map((camp) => (
                <tr key={camp.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-medium text-slate-900">{camp.title}</td>
                  <td className="px-6 py-4 text-slate-500">
                    {camp.targetAudience === "LOCATION_SPECIFIC" ? (
                      <span className="flex flex-col gap-0.5">
                        <span>Location Specific</span>
                        <span className="text-xs text-slate-400">
                          {camp.targetCity || "Any City"}, {camp.targetState || "Any State"}
                        </span>
                      </span>
                    ) : camp.targetAudience}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        camp.status === "SENT" ? "bg-green-100 text-green-700" :
                        camp.status === "SCHEDULED" ? "bg-blue-100 text-blue-700" :
                        "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {camp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-600 font-medium">
                    {camp.openCount || 0}
                  </td>
                  <td className="px-6 py-4 text-center text-slate-600 font-medium">
                    {camp.clickCount || 0}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {format(new Date(camp.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={async () => {
                        if (confirm("Are you sure you want to delete this campaign?")) {
                          const res = await fetch(`/api/admin/campaigns/${camp.id}`, { method: "DELETE" });
                          if (res.ok) {
                            setCampaigns(prev => prev.filter(c => c.id !== camp.id));
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
        <CampaignForm 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={(newCamp) => {
            setCampaigns(prev => [newCamp, ...prev]);
            setIsFormOpen(false);
          }} 
        />
      )}
    </div>
  );
}
