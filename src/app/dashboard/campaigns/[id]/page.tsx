"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { useSession } from "next-auth/react";
import { CldUploadWidget } from "next-cloudinary";
import RecommendedCreators from "@/components/outreach/RecommendedCreators";

type DailyReport = {
  id: string;
  dayNumber: number;
  title: string;
  description: string;
  status: string;
  reviewNote?: string;
  imageUrls: string[];
  videoUrls: string[];
  link?: string;
  createdAt: string;
};

type Deliverable = {
  id: string;
  title: string;
  type: string;
  url: string;
  status: string;
  reviewNote?: string;
  createdAt: string;
};

type CampaignActivity = {
  id: string;
  actorType: string;
  action: string;
  description?: string;
  createdAt: string;
};

type CampaignStatusHistory = {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  note?: string;
  createdAt: string;
};

type Campaign = {
  id: string;
  title: string;
  description: string;
  budget: number | null;
  timeline: string | null;
  timelineDays: number;
  progress: number;
  campaignType: string;
  status: string;
  startedAt?: string;
  createdAt: string;
  cancellationReason?: string;
  requesterId: string;
  influencerProfileId: string;
  requester: { id: string; name: string; avatar: string | null };
  influencerProfile: { user: { id: string; name: string; avatar: string | null }; category?: string; city?: string };
  conversations: { id: string }[];
  deliverables: Deliverable[];
  dailyReports: DailyReport[];
  statusHistory: CampaignStatusHistory[];
  activities: CampaignActivity[];
  paymentScreenshotUrl?: string;
  paymentVerifiedAt?: string;
  paymentRejectedAt?: string;
  paymentVerificationNote?: string;
  paymentReferenceId?: string;
  paymentVerified?: boolean;
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

  // Daily Report form state
  const [reportForm, setReportForm] = useState({
    title: "",
    description: "",
    link: "",
  });

  // Cancellation State
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [paymentForm, setPaymentForm] = useState({ referenceId: "" });
  const [uploadingPayment, setUploadingPayment] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });

  const handlePaymentUpload = async (result: any) => {
    if (result.event !== "success") return;
    setUploadingPayment(true);
    try {
      const res = await fetch(`/api/campaigns/request/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "PAYMENT_VERIFICATION_PENDING",
          paymentScreenshotUrl: result.info.secure_url,
          paymentReferenceId: paymentForm.referenceId,
        })
      });
      if (!res.ok) throw new Error("Failed to submit payment proof");
      showToast("Payment proof submitted successfully", "success");
      fetchCampaign();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setUploadingPayment(false);
    }
  };

  const submitReview = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/campaigns/request/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewForm)
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to submit review");
      }
      showToast("Review submitted successfully", "success");
      fetchCampaign();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setUpdating(false);
    }
  };

  const showToast = (msg: string, type: "error"|"success") => {
    setToastMessage({msg, type});
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchCampaign = () => {
    fetch(`/api/campaigns/request/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load campaign");
        return res.json();
      })
      .then(setCampaign)
      .catch((err) => showToast(err.message, "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCampaign();
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

  const handleUpdateStatus = async (newStatus: string, reason?: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/campaigns/request/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, cancellationReason: reason })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to update status");
      }
      
      showToast(`Campaign ${newStatus.toLowerCase()} successfully`, "success");
      setShowCancelPrompt(false);
      setCancelReason("");
      fetchCampaign();
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
          url: result.info.secure_url,
          type: result.info.format || "LINK",
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      showToast("Deliverable uploaded successfully", "success");
      fetchCampaign();
    } catch (err: any) {
      showToast(err.message || "Failed to upload deliverable", "error");
    } finally {
      setUploadingDeliverable(false);
    }
  };

  const submitDailyReport = async (dayNumber: number) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/campaigns/${id}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayNumber,
          title: reportForm.title || `Day ${dayNumber} Report`,
          description: reportForm.description,
          link: reportForm.link,
          imageUrls: [],
          videoUrls: []
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      showToast("Report submitted successfully", "success");
      setReportForm({ title: "", description: "", link: "" });
      fetchCampaign();
    } catch (err: any) {
      showToast(err.message || "Failed to submit report", "error");
    } finally {
      setUpdating(false);
    }
  };

  // Determine which day is currently active for the influencer
  const currentDayNumber = campaign.dailyReports.length + 1;
  const canSubmitReport = campaign.status === "IN_PROGRESS" && currentDayNumber <= campaign.timelineDays;
  const canSubmitDeliverables = campaign.progress === 100 && (campaign.status === "IN_PROGRESS" || campaign.status === "REVISION_REQUIRED");

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 relative">
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
                width: campaign.status === "PENDING" ? "5%" : 
                       campaign.status === "ACCEPTED" ? "20%" : 
                       campaign.status === "IN_PROGRESS" ? "35%" : 
                       campaign.status === "DELIVERABLES_SUBMITTED" || campaign.status === "REVISION_REQUIRED" ? "50%" : 
                       campaign.status === "PAYMENT_PENDING" || campaign.status === "PAYMENT_REJECTED" ? "65%" : 
                       campaign.status === "PAYMENT_VERIFICATION_PENDING" ? "85%" :  
                       "100%" 
              }}
            />
          </div>
          
          {["PENDING", "ACCEPTED", "IN_PROGRESS", "SUBMITTED", "PAYMENT", "VERIFICATION", "COMPLETED"].map((step, idx) => {
            let stepStatus = "upcoming";
            if (campaign.status === "REJECTED" || campaign.status === "CANCELLED") {
              if (idx === 0) stepStatus = "completed"; // Pending is past
              else if (idx === 1) stepStatus = "failed"; // Failed at accepted
              else stepStatus = "upcoming";
            } else {
              const currentIdx = ["PENDING", "ACCEPTED", "IN_PROGRESS", "DELIVERABLES_SUBMITTED", "PAYMENT_PENDING", "PAYMENT_VERIFICATION_PENDING", "COMPLETED"].indexOf(
                campaign.status === "REVISION_REQUIRED" ? "DELIVERABLES_SUBMITTED" : 
                campaign.status === "PAYMENT_REJECTED" ? "PAYMENT_PENDING" :
                campaign.status === "PAYMENT_VERIFIED" ? "COMPLETED" :
                campaign.status
              );
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
                  {step === "DELIVERABLES_SUBMITTED" ? "SUBMITTED" : step.replace("_", " ")}
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
            campaign.status === "REVISION_REQUIRED" ? "bg-orange-100 text-orange-700" :
            campaign.status === "REJECTED" || campaign.status === "CANCELLED" ? "bg-red-100 text-red-700" :
            "bg-emerald-100 text-emerald-700"
          }`}>
            {campaign.status.replace("_", " ")}
          </span>
        </div>

        {campaign.status === "REVISION_REQUIRED" && (
          <div className="mx-6 md:mx-8 mt-6 p-4 bg-orange-50 border border-orange-200 rounded-xl text-orange-800">
            <h4 className="font-bold mb-1 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Revision Requested
            </h4>
            <p className="text-sm">The brand has requested a revision on your final deliverables. Please review their notes, make changes, and resubmit.</p>
          </div>
        )}

        <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Requirements & Description</h3>
              <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap bg-slate-50 p-6 rounded-xl border border-slate-100">
                {campaign.description}
              </div>
            </section>

            {/* Daily Reports Section */}
            {(campaign.status === "IN_PROGRESS" || campaign.status === "DELIVERABLES_SUBMITTED" || campaign.status === "REVISION_REQUIRED" || campaign.status === "COMPLETED") && (
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Daily Reports</h3>
                  <span className="text-sm font-medium text-slate-500">{campaign.dailyReports.length} / {campaign.timeline === "Flexible" ? "Flexible" : `${campaign.timelineDays} Days`}</span>
                </div>
                
                <div className="space-y-4">
                  {/* Render submitted reports */}
                  {campaign.dailyReports.map((report) => (
                    <div key={report.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-slate-800">Day {report.dayNumber}: {report.title}</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                          report.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" :
                          report.status === "REVISION_REQUIRED" ? "bg-orange-100 text-orange-700" :
                          "bg-blue-100 text-blue-700"
                        }`}>{report.status.replace("_", " ")}</span>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{report.description}</p>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          if (!report.link || report.link.trim().length === 0 || report.link === "undefined") {
                            showToast("Nothing sent", "error");
                            return;
                          }
                          let finalUrl = report.link.trim();
                          if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
                            finalUrl = "https://" + finalUrl;
                          }
                          window.open(finalUrl, "_blank", "noopener,noreferrer");
                        }} 
                        className="text-xs text-indigo-500 hover:underline text-left"
                      >
                        View Link
                      </button>
                      {report.reviewNote && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
                          <span className="font-semibold block mb-1">Brand Feedback:</span>
                          {report.reviewNote}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Render input form for today's report if influencer */}
                  {isInfluencer && canSubmitReport && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
                      <h4 className="font-bold text-indigo-900 mb-3">Submit Day {currentDayNumber} Report</h4>
                      <div className="space-y-3">
                        <input 
                          type="text" 
                          placeholder="Report Title (optional)" 
                          className="w-full px-3 py-2 rounded-lg border border-indigo-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={reportForm.title}
                          onChange={(e) => setReportForm({...reportForm, title: e.target.value})}
                        />
                        <textarea 
                          placeholder="What was completed today?" 
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg border border-indigo-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={reportForm.description}
                          onChange={(e) => setReportForm({...reportForm, description: e.target.value})}
                        ></textarea>
                        <input 
                          type="url" 
                          placeholder="Link to content (optional)" 
                          className="w-full px-3 py-2 rounded-lg border border-indigo-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={reportForm.link}
                          onChange={(e) => setReportForm({...reportForm, link: e.target.value})}
                        />
                        <button 
                          onClick={() => submitDailyReport(currentDayNumber)}
                          disabled={updating || !reportForm.description}
                          className="w-full py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                          Submit Report
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Render pending upcoming days */}
                  {Array.from({ length: campaign.timelineDays - (isInfluencer && canSubmitReport ? currentDayNumber : campaign.dailyReports.length) }).map((_, idx) => {
                    const dayOffset = (isInfluencer && canSubmitReport ? currentDayNumber : campaign.dailyReports.length) + idx + 1;
                    return (
                      <div key={`empty-${dayOffset}`} className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-4 flex items-center justify-between text-slate-400">
                        <span className="font-medium">Day {dayOffset}</span>
                        <span className="text-xs font-semibold uppercase">Pending</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Deliverables Section */}
            {(campaign.status === "IN_PROGRESS" || campaign.status === "DELIVERABLES_SUBMITTED" || campaign.status === "REVISION_REQUIRED" || campaign.status === "COMPLETED") && (
              <section className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Final Deliverables</h3>
                  {isInfluencer && canSubmitDeliverables && (
                    <CldUploadWidget uploadPreset="ad_space" onSuccess={handleDeliverableUpload}>
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
                    {campaign.progress < 100 ? "Complete all daily reports to unlock deliverables submission." : "No deliverables uploaded yet."}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {campaign.deliverables.map((d) => (
                      <div key={d.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                          <span className="font-semibold text-sm text-slate-800 truncate">{d.title}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${d.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : d.status === 'REVISION_REQUIRED' ? 'bg-orange-100 text-orange-700' : 'bg-slate-200 text-slate-600'}`}>{d.status}</span>
                        </div>
                        <div className="p-3 flex items-center justify-between">
                          <span className="text-xs text-slate-500 uppercase">{d.type}</span>
                          <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-indigo-600 hover:text-indigo-800">View Asset</a>
                        </div>
                        {d.reviewNote && (
                          <div className="px-3 pb-3 text-xs text-red-600">
                            <strong>Note:</strong> {d.reviewNote}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            
            {/* Payment Section */}
            {(campaign.status === "PAYMENT_PENDING" || campaign.status === "PAYMENT_VERIFICATION_PENDING" || campaign.status === "PAYMENT_REJECTED" || campaign.status === "COMPLETED") && (
              <section className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Payment Verification</h3>
                
                {campaign.status === "PAYMENT_REJECTED" && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
                    <h4 className="font-bold mb-1">Payment Rejected</h4>
                    <p className="text-sm">{campaign.paymentVerificationNote || "Please verify your payment details and re-upload the proof."}</p>
                  </div>
                )}

                {(campaign.status === "PAYMENT_PENDING" || campaign.status === "PAYMENT_REJECTED") && isRequester && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
                    <h4 className="font-bold text-indigo-900 mb-3">Upload Payment Proof</h4>
                    <div className="space-y-3">
                      <input 
                        type="text" 
                        placeholder="Reference ID / UTR Number" 
                        className="w-full px-3 py-2 rounded-lg border border-indigo-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={paymentForm.referenceId}
                        onChange={(e) => setPaymentForm({...paymentForm, referenceId: e.target.value})}
                      />
                      <CldUploadWidget uploadPreset="ad_space" onSuccess={handlePaymentUpload}>
                        {({ open }) => (
                          <button 
                            onClick={() => open()} 
                            disabled={uploadingPayment || !paymentForm.referenceId} 
                            className="w-full py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
                          >
                            {uploadingPayment ? "Uploading..." : "Upload Screenshot & Submit"}
                          </button>
                        )}
                      </CldUploadWidget>
                    </div>
                  </div>
                )}

                {(campaign.status === "PAYMENT_VERIFICATION_PENDING" || campaign.status === "COMPLETED") && campaign.paymentScreenshotUrl && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      <a href={campaign.paymentScreenshotUrl} target="_blank" rel="noreferrer" className="block w-24 h-24 rounded-lg bg-slate-200 overflow-hidden shrink-0 border border-slate-300">
                        <img src={campaign.paymentScreenshotUrl} alt="Payment Proof" className="w-full h-full object-cover" />
                      </a>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Payment Reference</p>
                        <p className="font-bold text-slate-800 text-lg">{campaign.paymentReferenceId || "N/A"}</p>
                        {campaign.status === "COMPLETED" ? (
                          <span className="inline-flex mt-2 items-center px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-md">
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex mt-2 items-center px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-md">
                            Pending Verification
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Optional Reviews Section */}
            {campaign.status === "COMPLETED" && (
              <section className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Leave a Review</h3>
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <p className="text-sm text-slate-600 mb-4">How was your experience working on this campaign? Your review helps keep the community safe and reliable.</p>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => setReviewForm({...reviewForm, rating: star})} className={`w-8 h-8 rounded-full flex items-center justify-center ${reviewForm.rating >= star ? 'bg-amber-100 text-amber-500' : 'bg-slate-100 text-slate-400'}`}>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        </button>
                      ))}
                    </div>
                    <textarea 
                      placeholder="Write your review here (optional)..." 
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                    ></textarea>
                    <button 
                      onClick={submitReview}
                      disabled={updating}
                      className="px-4 py-2 bg-slate-900 text-white rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                      Submit Review
                    </button>
                  </div>
                </div>
              </section>
            )}


            {/* Status History & Timeline */}
            <section className="pt-4 border-t border-slate-100">
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Activity Timeline</h3>
               <div className="space-y-4">
                 {campaign.activities.map((activity) => (
                   <div key={activity.id} className="flex gap-4 items-start">
                     <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                       <span className="text-[10px] font-bold text-slate-500">{activity.actorType[0]}</span>
                     </div>
                     <div className="flex-1">
                       <p className="text-sm font-semibold text-slate-800">{activity.action}</p>
                       {activity.description && <p className="text-xs text-slate-500 mt-1">{activity.description}</p>}
                       <p className="text-[10px] text-slate-400 mt-1">{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}</p>
                     </div>
                   </div>
                 ))}
               </div>
            </section>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Overview</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Progress</p>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 mb-1">
                    <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${campaign.progress}%` }}></div>
                  </div>
                  <p className="font-semibold text-slate-800">{campaign.progress}% Complete</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Budget</p>
                  <p className="font-semibold text-slate-800">{campaign.budget ? `₹${campaign.budget.toLocaleString()}` : "Negotiable"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Timeline</p>
                  <p className="font-semibold text-slate-800">{campaign.timeline === "Flexible" ? "Flexible" : `${campaign.timelineDays} Days`}</p>
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
          
          {(campaign.status !== "PENDING" && campaign.status !== "REJECTED" && campaign.status !== "CANCELLED") && conversationId && (
            <Link 
              href={`/dashboard/messages/${conversationId}`}
              className="w-full sm:w-auto px-6 py-3 bg-white border border-slate-200 hover:border-indigo-300 text-indigo-600 font-medium rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Message
            </Link>
          )}

          {/* Cancellation Prompt */}
          {showCancelPrompt ? (
            <div className="w-full sm:w-auto flex items-center gap-2">
              <input 
                type="text" 
                placeholder="Reason for cancellation..." 
                className="px-4 py-2 border border-red-200 rounded-xl text-sm w-full sm:w-64"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
              />
              <button 
                onClick={() => handleUpdateStatus("CANCELLED", cancelReason)}
                disabled={updating || !cancelReason}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {updating ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  "Confirm"
                )}
              </button>
              <button 
                onClick={() => setShowCancelPrompt(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-medium rounded-xl"
              >
                Back
              </button>
            </div>
          ) : (
            <>
              {(campaign.status === "PENDING" || campaign.status === "ACCEPTED" || campaign.status === "IN_PROGRESS") && isRequester && (
                <button 
                  onClick={() => setShowCancelPrompt(true)}
                  disabled={updating}
                  className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-red-50 text-red-600 font-medium rounded-xl border border-red-200 transition-colors"
                >
                  Cancel Campaign
                </button>
              )}

              {campaign.status === "PENDING" && isInfluencer && (
                <>
                  <button 
                    onClick={() => handleUpdateStatus("REJECTED")}
                    disabled={updating}
                    className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-red-50 text-red-600 font-medium rounded-xl border border-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating ? "Processing..." : "Reject"}
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus("ACCEPTED")}
                    disabled={updating}
                    className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {updating ? (
                      <>
                        <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      "Accept Campaign"
                    )}
                  </button>
                </>
              )}


              {campaign.status === "PAYMENT_VERIFICATION_PENDING" && isInfluencer && (
                <>
                  <button 
                    onClick={() => {
                      const note = prompt("Please provide a reason for rejecting the payment:");
                      if (note) {
                        handleUpdateStatus("PAYMENT_REJECTED", note);
                      }
                    }}
                    disabled={updating}
                    className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-red-50 text-red-600 font-medium rounded-xl border border-red-200 transition-colors"
                  >
                    Reject Payment
                  </button>
                  <button 
                    onClick={() => {
                       handleUpdateStatus("PAYMENT_VERIFIED").then(() => handleUpdateStatus("COMPLETED"));
                    }}
                    disabled={updating}
                    className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition-colors"
                  >
                    Verify Payment & Complete Campaign
                  </button>
                </>
              )}


              {campaign.status === "ACCEPTED" && isInfluencer && (
                <button 
                  onClick={() => handleUpdateStatus("IN_PROGRESS")}
                  disabled={updating}
                  className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {updating ? (
                    <>
                      <svg className="w-5 h-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    "Start Work (In Progress)"
                  )}
                </button>
              )}

              {(campaign.status === "IN_PROGRESS" || campaign.status === "REVISION_REQUIRED") && isInfluencer && campaign.progress === 100 && (
                <button 
                  onClick={() => handleUpdateStatus("DELIVERABLES_SUBMITTED")}
                  disabled={updating || !campaign.deliverables?.length}
                  className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  Submit Final Deliverables
                </button>
              )}

              {campaign.status === "DELIVERABLES_SUBMITTED" && isRequester && (
                <>
                  <button 
                    onClick={() => {
                      const note = prompt("Please provide notes on what needs revision:");
                      if (note) {
                        setUpdating(true);
                        fetch(`/api/campaigns/request/${id}/status`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ status: "REVISION_REQUIRED", note })
                        }).then(() => fetchCampaign()).finally(() => setUpdating(false));
                      }
                    }}
                    disabled={updating}
                    className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-orange-50 text-orange-600 border border-orange-200 font-medium rounded-xl transition-colors"
                  >
                    Request Revision
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus("PAYMENT_PENDING")}
                    disabled={updating}
                    className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition-colors"
                  >
                    Approve Deliverables & Proceed to Payment
                  </button>
                </>
              )}
            </>
          )}

        </div>
      </div>

      {isRequester && campaign.status === "PENDING" && (
        <RecommendedCreators category={campaign.influencerProfile?.category || undefined} city={campaign.influencerProfile?.city || undefined} />
      )}
    </div>
  );
}
