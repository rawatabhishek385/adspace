"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CampaignRequestModalProps = {
  isOpen: boolean;
  onClose: () => void;
  influencerId: string;
  influencerType: "INDIVIDUAL" | "DIGITAL_MARKETER";
  influencerName: string;
};

export default function CampaignRequestModal({ isOpen, onClose, influencerId, influencerType, influencerName }: CampaignRequestModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [timelineDays, setTimelineDays] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{msg: string, type: "error"|"success"} | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string, type: "error"|"success") => {
    setToastMessage({msg, type});
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      showToast("Please provide a title and description.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/campaigns/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          influencerId,
          title,
          description,
          budget: budget ? parseFloat(budget.replace(/[^0-9.]/g, "")) : null,
          timeline: timeline === "Custom" ? `${timelineDays} Days` : (timeline || null),
          timelineDays: parseInt(timelineDays.toString()) || 1,
          campaignType: influencerType === "INDIVIDUAL" ? "INFLUENCER" : "DIGITAL_MARKETING"
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit request");
      }

      showToast("Campaign request sent successfully!", "success");
      onClose();
      setTitle("");
      setDescription("");
      setBudget("");
      setTimeline("");
      setTimelineDays(1);
      
      // Redirect to My Campaigns tab
      router.push("/dashboard/my-campaigns");
    } catch (err: any) {
      showToast(err.message || "Something went wrong.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      {toastMessage && (
        <div className={`fixed top-4 right-4 px-4 py-2 rounded shadow-lg text-white z-50 ${toastMessage.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {toastMessage.msg}
        </div>
      )}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">
            Request Campaign
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <p className="text-sm text-slate-500 mb-4">
            Send a campaign proposal to <span className="font-semibold text-indigo-600">{influencerName}</span>.
          </p>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Campaign Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Instagram Promotion for Restaurant"
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description & Requirements *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail your expectations, deliverables, and any relevant context..."
              rows={4}
              className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estimated Budget</label>
              <input
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. ₹10,000"
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Expected Timeline</label>
              <select
                value={timeline}
                onChange={(e) => {
                  const val = e.target.value;
                  setTimeline(val);
                  if (val === "7 Days") setTimelineDays(7);
                  else if (val === "15 Days") setTimelineDays(15);
                  else if (val === "1 Month") setTimelineDays(30);
                  else if (val === "Flexible") setTimelineDays(1);
                  else if (val === "Custom") setTimelineDays(1);
                }}
                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select</option>
                <option value="7 Days">7 Days</option>
                <option value="15 Days">15 Days</option>
                <option value="1 Month">1 Month</option>
                <option value="Flexible">Flexible</option>
                <option value="Custom">Custom (Enter Days)</option>
              </select>
            </div>
            {timeline === "Custom" && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Number of Days</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={timelineDays}
                  onChange={(e) => setTimelineDays(parseInt(e.target.value) || 1)}
                  placeholder="e.g. 10"
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                "Send Request"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
