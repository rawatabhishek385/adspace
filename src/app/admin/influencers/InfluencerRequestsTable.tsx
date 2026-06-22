"use client";

import { useState } from "react";
import { InfluencerProfile } from "@prisma/client";

type ProfileWithUser = InfluencerProfile & { user: { name: string, email: string } };

export default function InfluencerRequestsTable({ initialRequests }: { initialRequests: ProfileWithUser[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleStatusChange = async (id: string, newStatus: "PENDING" | "APPROVED" | "REJECTED") => {
    if (!confirm(`Are you sure you want to mark this request as ${newStatus}?`)) return;

    setLoadingId(id);
    try {
      const response = await fetch(`/api/admin/influencers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setRequests(requests.map(req => req.id === id ? { ...req, status: newStatus } : req));
      } else {
        const err = await response.json();
        alert(`Failed: ${err.message}`);
      }
    } catch (error) {
      alert("An error occurred");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
            <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
            <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Details</th>
            <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Followers</th>
            <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {requests.map((request) => (
            <tr key={request.id} className="hover:bg-slate-50 transition-colors">
              <td className="py-4 px-4">
                <div className="flex flex-col">
                  <span className="font-medium text-slate-800">{request.user.name}</span>
                  <span className="text-xs text-slate-500">{request.user.email}</span>
                </div>
              </td>
              <td className="py-4 px-4">
                <span className="text-sm text-slate-700">{request.type}</span>
              </td>
              <td className="py-4 px-4">
                <div className="flex flex-col text-sm text-slate-600 max-w-xs">
                  {request.companyName && <span className="font-medium">{request.companyName}</span>}
                  <span className="truncate">{request.description || "-"}</span>
                  <div className="flex flex-wrap gap-2 text-xs mt-1 text-blue-500">
                    {request.instagramUrl && <a href={request.instagramUrl} target="_blank" rel="noreferrer" className="hover:underline bg-blue-50 px-1.5 py-0.5 rounded">Instagram</a>}
                    {request.youtubeUrl && <a href={request.youtubeUrl} target="_blank" rel="noreferrer" className="hover:underline bg-red-50 text-red-500 px-1.5 py-0.5 rounded">YouTube</a>}
                    {request.twitterUrl && <a href={request.twitterUrl} target="_blank" rel="noreferrer" className="hover:underline bg-sky-50 text-sky-500 px-1.5 py-0.5 rounded">Twitter</a>}
                    {request.facebookUrl && <a href={request.facebookUrl} target="_blank" rel="noreferrer" className="hover:underline bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded">Facebook</a>}
                    {request.linkedinUrl && <a href={request.linkedinUrl} target="_blank" rel="noreferrer" className="hover:underline bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">LinkedIn</a>}
                  </div>
                  {request.pricePerPost && (
                    <div className="mt-2 text-xs font-medium text-emerald-600 bg-emerald-50 w-fit px-2 py-0.5 rounded-full">
                      Price: ₹{request.pricePerPost.toLocaleString("en-IN")} / post
                    </div>
                  )}
                </div>
              </td>
              <td className="py-4 px-4 text-sm text-slate-700">
                {request.followers ? request.followers.toLocaleString() : "-"}
              </td>
              <td className="py-4 px-4">
                <select
                  value={request.status}
                  onChange={(e) => handleStatusChange(request.id, e.target.value as "PENDING" | "APPROVED" | "REJECTED")}
                  disabled={loadingId === request.id}
                  className={`px-3 py-1.5 border text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 outline-none font-medium appearance-none cursor-pointer ${
                    request.status === "APPROVED" ? "bg-green-50 text-green-700 border-green-200" :
                    request.status === "REJECTED" ? "bg-red-50 text-red-700 border-red-200" :
                    "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  <option value="PENDING" className="bg-white text-slate-800">Pending</option>
                  <option value="APPROVED" className="bg-white text-slate-800">Approved</option>
                  <option value="REJECTED" className="bg-white text-slate-800">Rejected</option>
                </select>
              </td>
            </tr>
          ))}
          {requests.length === 0 && (
            <tr>
              <td colSpan={5} className="py-8 text-center text-slate-500">
                No influencer requests found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
