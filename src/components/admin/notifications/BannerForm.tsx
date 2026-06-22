"use client";

import { useState } from "react";

interface BannerFormProps {
  onClose: () => void;
  onSuccess: (banner: any) => void;
}

export default function BannerForm({ onClose, onSuccess }: BannerFormProps) {
  const [loading, setLoading] = useState(false);

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
      const res = await fetch("/api/admin/banners", {
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
          isActive: formData.get("isActive") === "true",
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
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800 text-lg">Create Banner</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">&times;</button>
        </div>
        <div className="overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input name="title" required className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" placeholder="e.g. 🔥 Summer Sale" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
              <textarea name="message" required className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" rows={3} placeholder="Get 20% off on all premium listings..." />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target Audience</label>
              <select name="targetAudience" value={audience} onChange={(e) => setAudience(e.target.value)} required className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                <option value="ALL_USERS">All Users</option>
                <option value="LOCATION_SPECIFIC">Location Specific (State/City)</option>
              </select>
            </div>
            
            {audience === "LOCATION_SPECIFIC" && (
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Target State</label>
                  <select name="targetState" value={state} onChange={(e) => setState(e.target.value)} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="">Any State</option>
                    {indianStates.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Target City</label>
                  <input name="targetCity" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Mumbai" />
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Image URL (optional)</label>
              <input name="imageUrl" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Action URL (optional)</label>
              <input name="actionUrl" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="/explore" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="isActive" value="true" defaultChecked id="isActive" className="w-4 h-4 text-blue-600 rounded" />
            <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Set as Active Banner (replaces current)</label>
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-50 font-medium rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
              {loading ? "Saving..." : "Create Banner"}
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
}
