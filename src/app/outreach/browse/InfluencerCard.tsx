import { InfluencerProfile } from "@prisma/client";
import Link from "next/link";
import InfluencerCardPresence from "./InfluencerCardPresence";

type ProfileWithUser = InfluencerProfile & { user: { name: string; avatar?: string | null; isOnline?: boolean; lastSeen?: Date | null } };

export default function InfluencerCard({ profile }: { profile: ProfileWithUser }) {
  const isIndividual = profile.type === "INDIVIDUAL";
  const displayName = isIndividual ? profile.user.name : (profile.companyName || profile.user.name);
  const badgeText = isIndividual ? "Verified Creator" : "Digital Marketing Agency";
  const badgeColor = isIndividual ? "bg-purple-100 text-purple-700" : "bg-indigo-100 text-indigo-700";
  const displayImage = profile.profileImage || profile.user.avatar;

  return (
    <Link href={`/profile/${profile.userId}`} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow group flex flex-col">
      <div className="h-32 bg-gradient-to-r from-blue-50 to-indigo-50 relative">
        <div className="absolute -bottom-10 left-6">
          <div className="w-20 h-20 rounded-xl bg-white p-1 shadow-sm border border-slate-100">
            <div className="w-full h-full rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center text-slate-400">
              {displayImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={displayImage} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold uppercase">{displayName.charAt(0)}</span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="pt-14 px-6 pb-6 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-lg font-bold text-slate-800 line-clamp-1" title={displayName}>
              {displayName}
            </h3>
            {profile.category && (
              <p className="text-sm text-slate-500">{profile.category}</p>
            )}
          </div>
        </div>

        <InfluencerCardPresence 
          userId={profile.userId}
          initialIsOnline={profile.user.isOnline || false}
          initialAvailabilityStatus={profile.availabilityStatus}
          initialResponseTime={profile.responseTime}
        />

        <div className="flex flex-col items-start gap-2 mt-1 mb-4">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${badgeColor}`}>
            {badgeText}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${profile.pricePerPost ? 'text-emerald-700 bg-emerald-100' : 'text-slate-600 bg-slate-100'}`}>
            {profile.pricePerPost ? `₹${profile.pricePerPost.toLocaleString("en-IN")} / POST` : "PRICE: TBD"}
          </span>
        </div>

        <p className="text-sm text-slate-600 line-clamp-3 mb-4 flex-1">
          {profile.description || (isIndividual ? "Individual creator profile." : "Digital marketing services.")}
        </p>

        <div className="flex items-center gap-4 text-sm text-slate-500 mt-auto pt-4 border-t border-slate-100">
          <div className="flex items-center gap-1 text-amber-500" title={`${profile.rating.toFixed(1)} Rating`}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-slate-600 font-medium">{profile.rating.toFixed(1)}</span>
            <span className="text-slate-400 text-xs">({profile.totalReviews})</span>
          </div>

          {profile.city && (
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate max-w-[80px]">{profile.city}</span>
            </div>
          )}
          
          {profile.followers !== null && profile.followers !== undefined && (
            <div className="flex items-center gap-1" title="Total Followers">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>{profile.followers >= 1000 ? `${(profile.followers / 1000).toFixed(1)}k` : profile.followers}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
