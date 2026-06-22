"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Activity {
  id: string;
  actionType: string;
  createdAt: string;
  listing?: {
    slug: string;
    title: string;
  };
  category?: {
    name: string;
  };
  city?: string;
}

export default function ActivityTimeline() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await fetch("/api/user/activity");
        const data = await res.json();
        if (data.success) {
          setActivities(data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, []);

  if (loading) {
    return <div className="animate-pulse h-32 bg-slate-100 rounded-xl"></div>;
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center">
        <h3 className="font-semibold text-slate-800 mb-2">No Recent Activity</h3>
        <p className="text-slate-500 text-sm">Start exploring listings to see your activity here.</p>
        <Link href="/listings" className="inline-block mt-4 text-sm font-medium text-blue-500 hover:text-blue-600">
          Browse Listings &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Recent Activity
      </h3>
      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
        {activities.map((activity, index) => (
          <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              {activity.actionType === "VIEW" && "👀"}
              {activity.actionType === "FAVORITE" && "❤️"}
              {activity.actionType === "MESSAGE" && "💬"}
            </div>
            
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-1 text-xs font-semibold text-blue-500 uppercase">
                {activity.actionType}
                <time className="text-slate-400 font-normal">{new Date(activity.createdAt).toLocaleDateString()}</time>
              </div>
              <div className="text-slate-700 text-sm">
                {activity.actionType === "VIEW" && activity.listing && (
                  <span>Viewed <Link href={`/listings/${activity.listing.slug}`} className="font-medium text-blue-500 hover:underline">{activity.listing.title}</Link></span>
                )}
                {activity.actionType === "FAVORITE" && activity.listing && (
                  <span>Favorited <Link href={`/listings/${activity.listing.slug}`} className="font-medium text-blue-500 hover:underline">{activity.listing.title}</Link></span>
                )}
                {activity.actionType === "MESSAGE" && activity.listing && (
                  <span>Messaged owner of <Link href={`/listings/${activity.listing.slug}`} className="font-medium text-blue-500 hover:underline">{activity.listing.title}</Link></span>
                )}
                {!activity.listing && activity.city && (
                  <span>Searched in <span className="font-medium text-slate-800">{activity.city}</span></span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
