"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ReportStatusSelectProps {
  reportId: string;
  reportType: "listing" | "user" | "influencer";
  currentStatus: "PENDING" | "REVIEWED" | "RESOLVED" | "APPROVED" | "DECLINED";
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  REVIEWED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  RESOLVED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  APPROVED: "bg-blue-600/20 text-blue-500 border-blue-600/30",
  DECLINED: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function ReportStatusSelect({ reportId, reportType, currentStatus }: ReportStatusSelectProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/admin/reports/${reportType}/${reportId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to update report status.");
      // In case of error, we just leave it or let React revert it depending on value logic
      // But since we use uncontrolled style via router.refresh, we just reset loading state
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative inline-block">
      <select
        value={currentStatus}
        onChange={handleStatusChange}
        disabled={isUpdating}
        className={`px-3 py-1.5 text-xs font-medium rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer ${
          isUpdating ? "opacity-50 cursor-not-allowed" : ""
        } ${statusColors[currentStatus] || "bg-slate-100 text-slate-800 border-slate-200"}`}
      >
        <option value="PENDING" className="bg-white text-slate-800">PENDING</option>
        <option value="REVIEWED" className="bg-white text-slate-800">REVIEWED</option>
        <option value="RESOLVED" className="bg-white text-slate-800">RESOLVED</option>
        <option value="APPROVED" className="bg-white text-slate-800">APPROVED</option>
        <option value="DECLINED" className="bg-white text-slate-800">DECLINED</option>
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-70">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
