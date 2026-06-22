"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useSession } from "next-auth/react";
import { CldUploadWidget } from "next-cloudinary";
import RecommendedCreators from "@/components/outreach/RecommendedCreators";

type Campaign = {
  id: string;
  title: string;
  description: string;
  budget: number | null;
  timeline: string | null;
  campaignType: string;
  status: string;
  createdAt: string;
  requesterId: string;
  influencerProfileId: string;
  requester: { id: string; name: string; avatar: string | null };
  influencerProfile: { user: { id: string; name: string; avatar: string | null }; category?: string; city?: string };
  conversations: { id: string }[];
  deliverables?: { id: string; title: string; fileUrl: string; fileType: string | null; createdAt: string }[];
};

export default function CampaignDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingDeliverable, setUploadingDeliverable] = useState(false);
  const [toastMessage, setToastMessage] = useState<{msg: string, type: "error"|"success"} | null>(null);

  const showToast = (msg: string, type: "error"|"success") => {
    setToastMessage({msg, type});
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    fetch(`/api/campaigns/request/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load campaign");
        return res.json();
      })
      .then(setCampaign)
      .catch((err) => showToast(err.message, "error"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading campaign details...</div>;
  }

  if (!campaign) {
    return <div className="p-8 text-center text-slate-500">Campaign not found.</div>;
  }

  const isRequester = session?.user?.id === campaign.requesterId;
  const isInfluencer = session?.user?.id === campaign.influencerProfile.user.id;
  const conversationId = campaign.conversations?.[0]?.id;

  const handleUpdateStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/campaigns/request/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error("Failed to update status");
      
      const data = await res.json();
      setCampaign(data.campaign);
      showToast(`Campaign ${newStatus.toLowerCase()} successfully`, "success");
      
      if (data.conversationId) {
        // Refresh to get conversation link
        window.location.reload();
      }
    } catch (err: any) {
      showToast(err.message || "Something went wrong", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeliverableUpload = async (result: any) => {
    if (result.event !== "success") return;
    setUploadingDeliverable(true);
    try {
      const res = await fetch(`/api/campaigns/${id}/deliverables`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: result.info.original_filename || "Campaign Deliverable",
          fileUrl: result.info.secure_url,
          fileType: result.info.format,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      showToast("Deliverable uploaded successfully", "success");
      // refresh campaign
      const refreshRes = await fetch(`/api/campaigns/request/${id}`);
      const refreshedCampaign = await refreshRes.json();
      setCampaign(refreshedCampaign);
    } catch (err: any) {
      showToast(err.message || "Failed to upload deliverable", "error");
    } finally {
      setUploadingDeliverable(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 relative">
      {toastMessage && (
        <div className={`fixed top-4 right-4 px-4 py-2 rounded shadow-lg text-white z-50 ${toastMessage.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {toastMessage.msg}
        </div>
      )}
      <Link href={isRequester ? "/dashboard/my-campaigns" : "/dashboard/campaigns"} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 mb-6 transition-colors">
        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Campaigns
      </Link>

      {/* Progress Timeline */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex justify-between items-center relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 z-0 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${campaign.status === "REJECTED" || campaign.status === "CANCELLED" ? "bg-red-400" : "bg-indigo-500"}`}
              style={{ 
                width: campaign.status === "PENDING" ? "10%" : 
                       campaign.status === "ACCEPTED" ? "30%" : 
                       campaign.status === "IN_PROGRESS" ? "50%" : 
                       campaign.status === "SUBMITTED" ? "80%" : 
                       "100%" 
              }}
            />
          </div>
          
          {["PENDING", "ACCEPTED", "IN_PROGRESS", "SUBMITTED", "COMPLETED"].map((step, idx) => {
            let stepStatus = "upcoming";
            if (campaign.status === "REJECTED" || campaign.status === "CANCELLED") {
              if (idx === 0) stepStatus = "completed"; // Pending is past
              else if (idx === 1) stepStatus = "failed"; // Failed at accepted
              else stepStatus = "upcoming";
            } else {
              const currentIdx = ["PENDING", "ACCEPTED", "IN_PROGRESS", "SUBMITTED", "COMPLETED"].indexOf(campaign.status);
              if (idx < currentIdx) stepStatus = "completed";
              else if (idx === currentIdx) stepStatus = "current";
            }

            return (
              <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-colors ${
                  stepStatus === "completed" ? "bg-indigo-500 text-white" :
                  stepStatus === "current" ? "bg-white border-indigo-500 text-indigo-600 border-[3px]" :
                  stepStatus === "failed" ? "bg-red-500 text-white" :
                  "bg-slate-200 text-slate-400"
                }`}>
                  {stepStatus === "completed" ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  ) : stepStatus === "failed" ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                  ) : (
                    <span className="text-xs font-bold">{idx + 1}</span>
                  )}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider hidden sm:block ${
                  stepStatus === "current" ? "text-indigo-600" :
                  stepStatus === "failed" ? "text-red-500" :
                  "text-slate-400"
                }`}>
                  {step === "IN_PROGRESS" ? "IN PROGRESS" : step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{campaign.title}</h1>
            <p className="text-sm text-slate-500">
              Requested {formatDistanceToNow(new Date(campaign.createdAt), { addSuffix: true })}
            </p>
          </div>
          
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider ${
            campaign.status === "PENDING" ? "bg-amber-100 text-amber-700" :
            campaign.status === "ACCEPTED" ? "bg-blue-100 text-blue-700" :
            campaign.status === "REJECTED" || campaign.status === "CANCELLED" ? "bg-red-100 text-red-700" :
            "bg-emerald-100 text-emerald-700"
          }`}>
            {campaign.status}
          </span>
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Requirements & Description</h3>
              <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap bg-slate-50 p-6 rounded-xl border border-slate-100">
                {campaign.description}
              </div>
            </section>

            {/* Deliverables Section */}
            {(campaign.status === "IN_PROGRESS" || campaign.status === "SUBMITTED" || campaign.status === "COMPLETED") && (
              <section className="pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Deliverables</h3>
                  {isInfluencer && (campaign.status === "IN_PROGRESS" || campaign.status === "SUBMITTED") && (
                    <CldUploadWidget uploadPreset="ad_space_images" onSuccess={handleDeliverableUpload}>
                      {({ open }) => (
                        <button onClick={() => open()} disabled={uploadingDeliverable} className="text-xs font-semibold px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors">
                          {uploadingDeliverable ? "Uploading..." : "+ Upload File"}
                        </button>
                      )}
                    </CldUploadWidget>
                  )}
                </div>
                {(!campaign.deliverables || campaign.deliverables.length === 0) ? (
                  <div className="bg-slate-50 border border-slate-100 border-dashed rounded-xl p-8 text-center text-slate-500 text-sm">
                    No deliverables uploaded yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {campaign.deliverables.map((d: any) => (
                      <a key={d.id} href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white border border-slate-200 hover:border-indigo-300 rounded-xl shadow-sm transition-colors group">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-500 flex items-center justify-center rounded-lg group-hover:bg-indigo-500 group-hover:text-white transition-colors shrink-0">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-semibold text-sm text-slate-800 truncate">{d.title}</p>
                          <p className="text-xs text-slate-500 uppercase">{d.fileType || "File"}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Budget</p>
                  <p className="font-semibold text-slate-800">{campaign.budget ? `₹${campaign.budget.toLocaleString()}` : "Negotiable"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Timeline</p>
                  <p className="font-semibold text-slate-800">{campaign.timeline || "Flexible"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Campaign Type</p>
                  <p className="font-semibold text-slate-800">{campaign.campaignType.replace("_", " ")}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                {(isRequester ? campaign.influencerProfile.user.avatar : campaign.requester.avatar) ? (
                  <img src={(isRequester ? campaign.influencerProfile.user.avatar : campaign.requester.avatar)!} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center font-bold text-slate-500">
                    {(isRequester ? campaign.influencerProfile.user.name[0] : campaign.requester.name[0])}
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500">{isRequester ? "Influencer" : "Brand / Requester"}</p>
                <p className="font-semibold text-slate-800 line-clamp-1">
                  {isRequester ? campaign.influencerProfile.user.name : campaign.requester.name}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Area */}
        <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-end items-center gap-4">
          
          {(campaign.status === "ACCEPTED" || campaign.status === "IN_PROGRESS" || campaign.status === "COMPLETED") && conversationId && (
            <Link 
              href={`/dashboard/messages/${conversationId}`}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Open Conversation
            </Link>
          )}

          {campaign.status === "PENDING" && isRequester && (
            <button 
              onClick={() => handleUpdateStatus("CANCELLED")}
              disabled={updating}
              className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-red-50 text-red-600 font-medium rounded-xl border border-red-200 transition-colors"
            >
              Cancel Request
            </button>
          )}

          {campaign.status === "PENDING" && isInfluencer && (
            <>
              <button 
                onClick={() => handleUpdateStatus("REJECTED")}
                disabled={updating}
                className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-red-50 text-red-600 font-medium rounded-xl border border-red-200 transition-colors"
              >
                Reject
              </button>
              <button 
                onClick={() => handleUpdateStatus("ACCEPTED")}
                disabled={updating}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition-colors"
              >
                Accept Campaign
              </button>
            </>
          )}

          {campaign.status === "ACCEPTED" && isInfluencer && (
            <button 
              onClick={() => handleUpdateStatus("IN_PROGRESS")}
              disabled={updating}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition-colors"
            >
              Start Work (In Progress)
            </button>
          )}

          {campaign.status === "IN_PROGRESS" && isInfluencer && (
            <button 
              onClick={() => handleUpdateStatus("SUBMITTED")}
              disabled={updating || !campaign.deliverables?.length}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              Submit Deliverables
            </button>
          )}

          {campaign.status === "SUBMITTED" && isRequester && (
            <button 
              onClick={() => handleUpdateStatus("COMPLETED")}
              disabled={updating}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition-colors"
            >
              Approve & Complete
            </button>
          )}

        </div>
      </div>

      {isRequester && campaign.status === "PENDING" && (
        <RecommendedCreators category={campaign.influencerProfile?.category || undefined} city={campaign.influencerProfile?.city || undefined} />
      )}
    </div>
  );
}
