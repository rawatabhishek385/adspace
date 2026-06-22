"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AutoReplySettings from "@/components/settings/AutoReplySettings";

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [isLoggingOutAll, setIsLoggingOutAll] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE") return;
    
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch("/api/settings/account", {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        await signOut({ callbackUrl: "/" });
      } else {
        setDeleteError(data.message || "Failed to delete account");
        setIsDeleting(false);
      }
    } catch (err) {
      setDeleteError("An unexpected error occurred.");
      setIsDeleting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    setIsChangingPassword(true);
    setPasswordMessage(null);

    try {
      const res = await fetch("/api/settings/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (data.success) {
        setPasswordMessage({ type: "success", text: "Password updated successfully" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMessage({ type: "error", text: data.message || "Failed to update password" });
      }
    } catch (err) {
      setPasswordMessage({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    if (!confirm("Are you sure you want to log out from all devices? You will be asked to log in again.")) return;
    
    setIsLoggingOutAll(true);
    try {
      const res = await fetch("/api/settings/account/logout-all", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        await signOut({ callbackUrl: "/login" });
      } else {
        alert(data.message || "Failed to log out all devices");
        setIsLoggingOutAll(false);
      }
    } catch (err) {
      alert("An unexpected error occurred.");
      setIsLoggingOutAll(false);
    }
  };

  if (!session?.user) return null;

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Account Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your account preferences and data.</p>
      </div>

      <AutoReplySettings />

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-6">
        <h3 className="text-lg font-semibold text-slate-800">Change Password</h3>
        
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          {passwordMessage && (
            <div className={`p-3 rounded-lg text-sm ${passwordMessage.type === "success" ? "bg-blue-50 text-blue-600 border border-blue-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
              {passwordMessage.text}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isChangingPassword}
            className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            {isChangingPassword ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-6">
        <h3 className="text-lg font-semibold text-slate-800">Security</h3>
        
        <div className="border border-slate-200 rounded-xl p-5 bg-slate-50">
          <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
            <div>
              <h4 className="font-semibold text-slate-800">Log out from all devices</h4>
              <p className="text-sm text-slate-500 mt-1 max-w-md">
                This will immediately invalidate your session on all other devices and browsers. You will be logged out of your current session as well.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogoutAllDevices}
              disabled={isLoggingOutAll}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              {isLoggingOutAll ? "Logging out..." : "Log Out All Devices"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-6">
        <h3 className="text-lg font-semibold text-slate-800">Danger Zone</h3>
        
        <div className="border border-red-200 rounded-xl p-5 bg-red-50/50">
          <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
            <div>
              <h4 className="font-semibold text-red-600">Delete Account</h4>
              <p className="text-sm text-slate-600 mt-1 max-w-md">
                Permanently delete your account and all of your content, including listings, messages, and reviews. This action cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Are you absolutely sure?</h3>
            <p className="text-sm text-slate-600 mb-6">
              This action cannot be undone. This will permanently delete your account, listings, messages, and remove your data from our servers.
            </p>

            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                {deleteError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Please type <span className="font-bold select-none text-slate-900">DELETE</span> to confirm.
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirm(false);
                    setConfirmText("");
                    setDeleteError(null);
                  }}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={confirmText !== "DELETE" || isDeleting}
                  className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    "Confirm Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
