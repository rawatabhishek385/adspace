"use client";

import { useState } from "react";

interface CampaignFormProps {
  onClose: () => void;
  onSuccess: (campaign: any) => void;
}

export default function CampaignForm({ onClose, onSuccess }: CampaignFormProps) {
  const [loading, setLoading] = useState(false);
  const [sendType, setSendType] = useState("INSTANT");
  const [audience, setAudience] = useState("ALL_USERS");
  const [state, setState] = useState("");

  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
    "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          message: formData.get("message"),
          imageUrl: formData.get("imageUrl") || null,
          actionUrl: formData.get("actionUrl") || null,
          targetAudience: formData.get("targetAudience"),
          targetState: formData.get("targetState") || null,
          targetCity: formData.get("targetCity") || null,
          sendType: formData.get("sendType"),
          scheduledAt: formData.get("scheduledAt") || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess(data.data);
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0">
          <h3 className="font-bold text-slate-800 text-lg">Broadcast Campaign</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input name="title" required className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Platform Update" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
              <textarea name="message" required className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" rows={3} placeholder="Write your notification message here..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target Audience</label>
              <select name="targetAudience" value={audience} onChange={(e) => setAudience(e.target.value)} required className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                <option value="ALL_USERS">All Users</option>
                <option value="BUYERS">Buyers</option>
                <option value="OWNERS">Space Owners</option>
                <option value="PREMIUM_USERS">Premium Users</option>
                <option value="LOCATION_SPECIFIC">Location Specific (State/City)</option>
                <option value="ACTIVE_USERS">Active Users</option>
                <option value="INACTIVE_USERS">Inactive Users</option>
              </select>
            </div>
            
            {audience === "LOCATION_SPECIFIC" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Target State</label>
                  <select name="targetState" value={state} onChange={(e) => setState(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                    <option value="">Any State</option>
                    {indianStates.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Target City</label>
                  <input name="targetCity" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Mumbai" />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Send Type</label>
              <select 
                name="sendType" 
                value={sendType}
                onChange={(e) => setSendType(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              >
                <option value="INSTANT">Instant (Send Now)</option>
                <option value="SCHEDULED">Schedule for Later</option>
              </select>
            </div>
            
            {sendType === "SCHEDULED" && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Schedule At</label>
                <input type="datetime-local" name="scheduledAt" required className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Image URL (optional)</label>
              <input name="imageUrl" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Action URL (optional)</label>
              <input name="actionUrl" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="/dashboard" />
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-50 font-medium rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
              {loading ? "Sending..." : sendType === "INSTANT" ? "Send Campaign" : "Schedule Campaign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
