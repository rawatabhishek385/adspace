"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { CldUploadWidget } from "next-cloudinary";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function CreatorWorkspace({ profile, campaigns }: { profile: any, campaigns: any[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  const completedCampaigns = campaigns.filter(c => c.status === "COMPLETED").length;
  const inProgressCampaigns = campaigns.filter(c => c.status === "IN_PROGRESS" || c.status === "SUBMITTED").length;
  const pendingRequests = campaigns.filter(c => c.status === "PENDING").length;

  const handlePortfolioUpload = async (result: any) => {
    if (result.info?.secure_url) {
      try {
        const res = await fetch("/api/influencer/portfolio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `Portfolio Item`,
            description: "Uploaded via workspace",
            imageUrl: result.info.secure_url,
            platform: "Other",
          })
        });
        if (res.ok) {
          toast.success("Portfolio updated!");
          router.refresh();
        }
      } catch (err) {
        toast.error("Failed to update portfolio");
      }
    }
  };

  return (
    <div className="mt-8 border-t border-slate-200 pt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Creator Hub</h2>
          <p className="text-slate-500 text-sm">Manage your collaborations and portfolio</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 mb-6">
        {["overview", "portfolio", "campaigns"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium text-sm capitalize transition-colors border-b-2 ${
              activeTab === tab 
                ? "border-indigo-600 text-indigo-600" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500 mb-1">Completed</p>
              <p className="text-2xl font-bold text-slate-800">{completedCampaigns}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500 mb-1">In Progress</p>
              <p className="text-2xl font-bold text-blue-500">{inProgressCampaigns}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500 mb-1">Pending Requests</p>
              <p className="text-2xl font-bold text-amber-500">{pendingRequests}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500 mb-1">Status</p>
              <p className={`text-xl font-bold ${profile.isAvailable ? "text-emerald-500" : "text-red-500"}`}>
                {profile.isAvailable ? "Available" : "Busy"}
              </p>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-2">Performance & Health</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-slate-500">Average Rating</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-lg font-bold text-amber-500">{profile.rating.toFixed(1)}</span>
                  <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500">Response Time</p>
                <p className="text-lg font-bold text-slate-800 mt-1">{profile.responseTime} hours</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Reviews</p>
                <p className="text-lg font-bold text-slate-800 mt-1">{profile.totalReviews}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "portfolio" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
            <div>
              <h3 className="font-bold text-slate-800">Portfolio Gallery</h3>
              <p className="text-sm text-slate-500">Showcase your best past campaigns to attract brands.</p>
            </div>
            <CldUploadWidget uploadPreset="ad_space" onSuccess={handlePortfolioUpload}>
              {({ open }) => (
                <button onClick={() => open()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                  Upload Work
                </button>
              )}
            </CldUploadWidget>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {profile.portfolio?.map((item: any) => (
              <div key={item.id} className="relative group rounded-xl overflow-hidden border border-slate-200 shadow-sm aspect-square bg-slate-100">
                <Image src={item.imageUrl} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end text-white">
                  <p className="font-bold text-sm truncate">{item.title}</p>
                  <p className="text-xs opacity-80">{item.platform}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "campaigns" && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-800">Active & Pending Campaigns</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {campaigns.filter(c => c.status !== "COMPLETED" && c.status !== "CANCELLED").length === 0 ? (
              <div className="p-8 text-center text-slate-500">No active or pending campaigns.</div>
            ) : (
              campaigns.filter(c => c.status !== "COMPLETED" && c.status !== "CANCELLED").map(campaign => (
                <div key={campaign.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0 overflow-hidden relative">
                      {campaign.requester.avatar ? (
                        <Image src={campaign.requester.avatar} alt="Requester" fill className="object-cover" />
                      ) : (
                        <span className="flex items-center justify-center w-full h-full text-slate-500 font-bold">{campaign.requester.name[0]}</span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 line-clamp-1">{campaign.title}</h4>
                      <p className="text-xs text-slate-500">{campaign.requester.name} • {formatDistanceToNow(new Date(campaign.createdAt), { addSuffix: true })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                      campaign.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                      campaign.status === "ACCEPTED" ? "bg-blue-100 text-blue-700" :
                      "bg-indigo-100 text-indigo-700"
                    }`}>
                      {campaign.status}
                    </span>
                    <Link href={`/dashboard/campaigns/${campaign.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                      Manage →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
