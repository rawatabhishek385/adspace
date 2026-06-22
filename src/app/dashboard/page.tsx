import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ListingCard } from "@/components/listings/ListingCard";
import ReviewReminderCard from "@/components/reviews/ReviewReminderCard";
import InactiveUserBanner from "@/components/dashboard/InactiveUserBanner";
import RecommendedListingsSection from "@/components/home/RecommendedListingsSection";
import NearbyListingsSection from "@/components/location/NearbyListingsSection";
import TrendingNearYou from "@/components/location/TrendingNearYou";
import ActivityTimeline from "@/components/dashboard/ActivityTimeline";
import EnablePushNotifications from "@/components/notifications/EnablePushNotifications";
import CreatorWorkspace from "@/components/dashboard/CreatorWorkspace";

export default async function DashboardPage() {
  const user = await requireAuth();

  // Fetch statistics
  const [totalListings, activeListings, featuredListings, recentListings, influencerProfile, campaignRequests] = await Promise.all([
    prisma.listing.count({ where: { ownerId: user.id } }),
    prisma.listing.count({ where: { ownerId: user.id, isActive: true } }),
    prisma.listing.count({ where: { ownerId: user.id, isFeatured: true } }),
    prisma.listing.findMany({
      where: { ownerId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
        category: { select: { id: true, name: true } },
        media: { select: { id: true, url: true, publicId: true, type: true } },
      },
    }),
    prisma.influencerProfile.findUnique({
      where: { userId: user.id },
      include: { portfolio: true }
    }),
    prisma.campaignRequest.findMany({
      where: { influencerProfile: { userId: user.id } },
      include: { requester: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard Overview</h1>
          <p className="mt-1 text-sm text-slate-500">Welcome back, {user.name}</p>
        </div>
        <Link 
          href="/dashboard/listings/create" 
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-slate-700 font-medium rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Listing
        </Link>
      </div>

      {/* ─── Inactive User Banner ────────────────────────────────────────── */}
      <InactiveUserBanner />

      {/* ─── Statistics Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
          <p className="text-sm font-medium text-slate-500 mb-1">Total Listings</p>
          <p className="text-3xl font-bold text-slate-800">{totalListings}</p>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
          <p className="text-sm font-medium text-slate-500 mb-1">Active Listings</p>
          <p className="text-3xl font-bold text-blue-500">{activeListings}</p>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
          <p className="text-sm font-medium text-slate-500 mb-1">Featured Spaces</p>
          <p className="text-3xl font-bold text-amber-500">{featuredListings}</p>
        </div>
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5">
          <p className="text-sm font-medium text-slate-500 mb-1">Account Status</p>
          <div className="flex items-center mt-2">
            <span className="flex w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
            <span className="text-lg font-semibold text-slate-800">Active</span>
          </div>
        </div>
      </div>

      {/* ─── Review Reminders ────────────────────────────────────────── */}
      <ReviewReminderCard />

      {/* ─── Notification Settings ────────────────────────────────────── */}
      <EnablePushNotifications />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* ─── Quick Actions ─────────────────────────────────────────── */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/dashboard/listings/create" className="flex items-center p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors group">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-4 group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="font-medium text-slate-600 group-hover:text-slate-800 transition-colors">Create Listing</div>
          </Link>
          <Link href="/listings" className="flex items-center p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors group">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-4 group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="font-medium text-slate-600 group-hover:text-slate-800 transition-colors">Browse Marketplace</div>
          </Link>
          <Link href="/dashboard/listings" className="flex items-center p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors group">
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mr-4 group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <div className="font-medium text-slate-600 group-hover:text-slate-800 transition-colors">Manage Listings</div>
          </Link>
        </div>
      </div>

      {/* ─── Recent Listings ───────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Recent Listings</h2>
          {totalListings > 0 && (
            <Link href="/dashboard/listings" className="text-sm text-blue-500 hover:text-blue-600 transition-colors">
              View all →
            </Link>
          )}
        </div>

        {totalListings === 0 ? (
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-12 text-center border-dashed">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Create Your First Listing</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
              Start monetizing your advertising spaces. It only takes a few minutes to get your first listing published.
            </p>
            <Link href="/dashboard/listings/create" className="inline-block px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-slate-700 font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/20">
              Create Listing
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {recentListings.map((listing) => (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              <ListingCard key={listing.id} listing={listing as any} showActions={false} />
            ))}
          </div>
        )}
        </div>
      </div>

      {/* ─── Sidebar: Activity Timeline ────────────────────────────── */}
      <div className="lg:col-span-1 space-y-8">
        <ActivityTimeline />
      </div>
    </div>

      {influencerProfile && influencerProfile.status === "APPROVED" && (
        <CreatorWorkspace profile={influencerProfile} campaigns={campaignRequests} />
      )}

      {/* ─── Intelligent Engagement Sections ─────────────────────────── */}
      <div className="space-y-8 pt-8 border-t border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">Discover More</h2>
        
        <RecommendedListingsSection />
        
        <TrendingNearYou />
        
        <NearbyListingsSection />
      </div>
    </div>
  );
}
