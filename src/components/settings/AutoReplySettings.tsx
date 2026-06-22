"use client";

import { useState, useEffect } from "react";

export default function AutoReplySettings() {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Fetch current settings
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/user/settings");
        const data = await res.json();
        if (data.success) {
          setEnabled(data.settings.autoReplyEnabled);
          setMessage(data.settings.autoReplyMessage || "Thanks for contacting me! I'm currently offline but will reply as soon as possible.");
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoReplyEnabled: enabled, autoReplyMessage: message }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-40 animate-pulse bg-slate-100 rounded-2xl" />;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-800 mb-4">Chat Auto-Reply</h3>
      <p className="text-sm text-slate-500 mb-6">
        Automatically respond to new messages when you are offline. This helps maintain a fast response rate.
      </p>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h4 className="font-medium text-slate-700">Enable Auto-Reply</h4>
          <p className="text-xs text-slate-500 mt-1">Replies will only be sent once every 24 hours per conversation.</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {enabled && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Auto-Reply Message
          </label>
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            placeholder="Thanks for reaching out! I'll get back to you shortly."
          />
        </div>
      )}

      <div className="flex justify-end items-center gap-4">
        {saved && <span className="text-green-600 text-sm font-medium">Saved successfully!</span>}
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-slate-900 text-white font-medium text-sm rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
