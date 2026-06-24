import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { ListingCard } from "@/components/listings/ListingCard";
import ProfileReviewEditButton from "@/components/reviews/ProfileReviewEditButton";
import ProfilePresence from "@/components/profile/ProfilePresence";
import InfluencerReviewForm from "@/components/influencers/InfluencerReviewForm";
import InfluencerReportButton from "@/components/influencers/InfluencerReportButton";
import CampaignRequestCTA from "@/components/outreach/CampaignRequestCTA";
import FavoriteInfluencerButton from "@/components/profile/FavoriteInfluencerButton";
import ChatWithInfluencerButton from "@/components/profile/ChatWithInfluencerButton";
import EditProfileButton from "@/components/profile/EditProfileButton";

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { name: true, bio: true },
  });

  if (!user) return { title: "Profile Not Found" };

  return {
    title: `${user.name} | Advertising Space Owner`,
    description: user.bio ? user.bio.substring(0, 160) : `View advertising spaces listed by ${user.name}.`,
  };
}

export default async function PublicProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const isOwnProfile = session?.user?.id === id;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      avatar: true,
      bio: true,
      city: true,
      state: true,
      country: true,
      email: true,
      website: true,
      createdAt: true,
      lastSeen: true,
      isOnline: true,
      averageRating: true,
      totalReviews: true,
      influencerProfile: {
        include: {
          reviews: {
            include: {
              reviewer: { select: { id: true, name: true, avatar: true } }
            },
            orderBy: { createdAt: "desc" }
          },
          portfolio: true,
          favoritedBy: session?.user?.id ? { where: { userId: session.user.id } } : false,
        }
      },
    },
  });

  if (!user) notFound();

  const listings = await prisma.listing.findMany({
    where: { ownerId: id, isActive: true },
    include: {
      category: { select: { id: true, name: true } },
      media: { select: { id: true, url: true, type: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalListings = await prisma.listing.count({ where: { ownerId: id } });
  const featuredListings = await prisma.listing.count({ where: { ownerId: id, isFeatured: true } });
  
  const viewsAggregation = await prisma.listing.aggregate({
    where: { ownerId: id },
    _sum: { viewCount: true },
  });
  const totalViews = viewsAggregation._sum.viewCount || 0;

  const reviews = await prisma.review.findMany({
    where: { revieweeId: id, isDeleted: false },
    include: {
      reviewer: { select: { id: true, name: true, avatar: true } },
      conversation: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const activeTotalReviews = reviews.length;
  const activeAverageRating = activeTotalReviews > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / activeTotalReviews
    : 0;

  const memberSince = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(user.createdAt);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 pt-24 pb-12">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Profile Header & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          {/* User Info Card */}
          <div className="lg:col-span-1 bg-white border border-slate-200 shadow-sm rounded-2xl p-8 text-center flex flex-col items-center">
            <div className="relative w-32 h-32 rounded-full bg-white border-4 border-slate-700 overflow-hidden mb-4 flex items-center justify-center shrink-0">
              {(user.avatar || user.influencerProfile?.profileImage) ? (
                <Image src={(user.avatar || user.influencerProfile?.profileImage)!} alt={user.name} fill className="object-cover" />
              ) : (
                <span className="text-4xl font-semibold text-slate-500">{user.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
            <p className="text-slate-500 text-sm mb-1">Advertising Space Owner</p>
            
            <ProfilePresence 
              userId={user.id} 
              initialIsOnline={user.isOnline}
              initialLastSeen={user.lastSeen ? user.lastSeen.toISOString() : null} 
            />
            
            {(user.city || user.state || user.country) && (
              <div className="flex items-center text-blue-500 text-sm mb-2">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {[user.city, user.state, user.country].filter(Boolean).join(", ")}
              </div>
            )}
            
            {user.email && (() => {
              const email = user.email;
              const shouldMask = !isOwnProfile;
              let displayEmail = email;
              if (shouldMask) {
                const [localPart, domain] = email.split("@");
                const maskedLocal = localPart.length > 2
                  ? `${localPart.slice(0, 2)}${"*".repeat(Math.min(localPart.length - 2, 5))}`
                  : localPart;
                const domainParts = domain.split(".");
                const maskedDomain = domainParts[0].length > 2
                  ? `${domainParts[0].slice(0, 2)}${"*".repeat(3)}`
                  : domainParts[0];
                displayEmail = `${maskedLocal}@${maskedDomain}.${domainParts.slice(1).join(".")}`;
              }
              return (
                <div className="flex items-center text-slate-500 text-sm mb-2">
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {shouldMask ? (
                    <span>{displayEmail}</span>
                  ) : (
                    <a href={`mailto:${user.email}`} className="hover:text-slate-600 transition-colors">
                      {user.email}
                    </a>
                  )}
                </div>
              );
            })()}
            
            <p className="text-slate-500 text-sm mb-6">Member Since {memberSince}</p>

            {isOwnProfile && (
              <EditProfileButton influencerProfile={user.influencerProfile} />
            )}

            {session?.user && !isOwnProfile && user.influencerProfile?.status === "APPROVED" && (
              <div className="space-y-3 mb-6">
                <CampaignRequestCTA 
                  influencerId={user.influencerProfile.id}
                  influencerType={user.influencerProfile.type}
                  influencerName={user.name}
                />
                <ChatWithInfluencerButton influencerUserId={user.id} />
              </div>
            )}

            {user.website && (
              <a href={user.website} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-500 hover:text-blue-600 text-sm mb-4 transition-colors">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                {user.website.replace(/^https?:\/\//, '')}
              </a>
            )}

            {user.bio && (
              <div className="w-full pt-4 border-t border-slate-200 mt-2">
                <p className="text-slate-600 text-sm leading-relaxed text-left">{user.bio}</p>
              </div>
            )}
          </div>

          {/* Statistics & Reputation & Influencer Info */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Influencer Profile Information */}
            {user.influencerProfile && user.influencerProfile.status === "APPROVED" && user.influencerProfile.isPublic && (
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 shadow-sm rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                  <svg className="w-24 h-24 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                        {user.influencerProfile.type === "INDIVIDUAL" ? "Verified Creator" : "Digital Agency"}
                      </span>
                      {user.influencerProfile.category && (
                        <span className="text-sm font-medium text-slate-600 bg-white/50 px-3 py-1 rounded-full border border-slate-200">
                          {user.influencerProfile.category}
                        </span>
                      )}
                    </div>
                    {session?.user && !isOwnProfile && (
                      <div className="flex items-center gap-2">
                        <FavoriteInfluencerButton 
                          influencerId={user.influencerProfile.id} 
                          initialFavorited={user.influencerProfile.favoritedBy?.length > 0} 
                        />
                        <InfluencerReportButton influencerId={user.influencerProfile.id} />
                      </div>
                    )}
                  </div>
                  
                  {user.influencerProfile.companyName && user.influencerProfile.type === "DIGITAL_MARKETER" && (
                    <h3 className="text-xl font-bold text-slate-800 mb-1">{user.influencerProfile.companyName}</h3>
                  )}
                  
                  <div className="mb-6 max-w-2xl">
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Services Offered</h4>
                    <p className="text-slate-600">
                      {user.influencerProfile.description || "Active in the digital marketing space."}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    {user.influencerProfile.followers !== null && (
                      <div className="bg-white/80 p-3 rounded-xl border border-blue-100">
                        <p className="text-sm text-slate-500 mb-1">Followers</p>
                        <p className="text-lg font-bold text-slate-800">
                          {user.influencerProfile.followers >= 1000 ? `${(user.influencerProfile.followers / 1000).toFixed(1)}k` : user.influencerProfile.followers}
                        </p>
                      </div>
                    )}
                    {user.influencerProfile.city && (
                      <div className="bg-white/80 p-3 rounded-xl border border-blue-100">
                        <p className="text-sm text-slate-500 mb-1">Base</p>
                        <p className="text-lg font-bold text-slate-800 truncate" title={user.influencerProfile.city}>
                          {user.influencerProfile.city}
                        </p>
                      </div>
                    )}
                    <div className="bg-white/80 p-3 rounded-xl border border-blue-100">
                      <p className="text-sm text-slate-500 mb-1">Status</p>
                      <p className={`text-sm font-bold truncate ${user.influencerProfile.availabilityStatus === 'AVAILABLE' ? "text-emerald-600" : user.influencerProfile.availabilityStatus === 'BUSY' ? "text-amber-500" : "text-red-500"}`}>
                        {user.influencerProfile.availabilityStatus === 'AVAILABLE' ? "🟢 Available" : user.influencerProfile.availabilityStatus === 'BUSY' ? "🟡 Busy" : "🔴 Offline"}
                      </p>
                    </div>
                    {user.influencerProfile.pricePerPost && (
                      <div className="bg-white/80 p-3 rounded-xl border border-blue-100">
                        <p className="text-sm text-slate-500 mb-1">Price per Post</p>
                        <p className="text-lg font-bold text-emerald-600">
                          ₹{user.influencerProfile.pricePerPost.toLocaleString("en-IN")}
                        </p>
                      </div>
                    )}
                    {user.influencerProfile.responseTime && (
                      <div className="bg-white/80 p-3 rounded-xl border border-blue-100">
                        <p className="text-sm text-slate-500 mb-1">Responds in</p>
                        <p className="text-lg font-bold text-slate-800">
                          {user.influencerProfile.responseTime}h
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {user.influencerProfile.instagramUrl && (
                      <a href={user.influencerProfile.instagramUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors">
                        Instagram
                      </a>
                    )}
                    {user.influencerProfile.youtubeUrl && (
                      <a href={user.influencerProfile.youtubeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors">
                        YouTube
                      </a>
                    )}
                    {user.influencerProfile.twitterUrl && (
                      <a href={user.influencerProfile.twitterUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors">
                        Twitter/X
                      </a>
                    )}
                    {user.influencerProfile.linkedinUrl && (
                      <a href={user.influencerProfile.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors">
                        LinkedIn
                      </a>
                    )}
                    {user.influencerProfile.facebookUrl && (
                      <a href={user.influencerProfile.facebookUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors">
                        Facebook
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Portfolio Section */}
            {user.influencerProfile && user.influencerProfile.status === "APPROVED" && user.influencerProfile.isPublic && user.influencerProfile.portfolio?.length > 0 && (
              <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 mt-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-slate-800">Previous Work</h2>
                </div>
                <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
                  {user.influencerProfile.portfolio.map((item: any) => (
                    <div key={item.id} className="break-inside-avoid mb-4 group relative rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 cursor-zoom-in">
                      <img src={item.imageUrl} alt={item.title} className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end text-white">
                        <p className="font-bold truncate">{item.title}</p>
                        <p className="text-xs opacity-80">{item.platform}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Influencer Reviews Section */}
            {user.influencerProfile && user.influencerProfile.status === "APPROVED" && user.influencerProfile.isPublic && (
              <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 mt-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-slate-800">Influencer Reviews</h2>
                </div>
                
                <div className="flex flex-col md:flex-row gap-8 items-center border-b border-slate-200 pb-8 mb-8">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-amber-500 mb-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <svg key={star} className={`w-8 h-8 ${star <= Math.round(user.influencerProfile!.rating) ? 'text-amber-500' : 'text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-2xl font-bold text-slate-600">{user.influencerProfile.rating.toFixed(1)} <span className="text-sm font-normal text-slate-500">out of 5</span></p>
                    <p className="text-sm text-slate-500 mt-1">{user.influencerProfile.totalReviews} Reviews</p>
                  </div>
                </div>

                {session?.user && !isOwnProfile && (
                  <div className="mb-8">
                    <InfluencerReviewForm influencerId={user.influencerProfile.id} />
                  </div>
                )}

                <div className="space-y-6">
                  {user.influencerProfile.reviews.length > 0 ? (
                    user.influencerProfile.reviews.map((review) => (
                      <div key={review.id} className="bg-slate-50 rounded-xl p-5 border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-white overflow-hidden flex items-center justify-center shrink-0 border border-slate-100">
                            {review.reviewer.avatar ? (
                              <Image src={review.reviewer.avatar} alt={review.reviewer.name} width={40} height={40} className="object-cover w-full h-full" />
                            ) : (
                              <span className="text-sm font-semibold text-slate-500">{review.reviewer.name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{review.reviewer.name}</p>
                            <div className="flex items-center gap-2">
                              <div className="flex text-amber-500">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <svg key={star} className={`w-3 h-3 ${star <= review.rating ? 'text-amber-500' : 'text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                              <span className="text-xs text-slate-500">{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(review.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-slate-600 text-sm ml-13">{review.comment}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 text-sm text-center">No influencer reviews yet.</p>
                  )}
                </div>
              </div>
            )}
            
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8">
              <h2 className="text-lg font-semibold text-slate-800 mb-6">Activity Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center hover:shadow-sm transition-shadow">
                  <p className="text-3xl font-bold text-blue-600 mb-1">{totalListings}</p>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Listings</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center hover:shadow-sm transition-shadow">
                  <p className="text-3xl font-bold text-blue-600 mb-1">{listings.length}</p>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Active Listings</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center hover:shadow-sm transition-shadow">
                  <p className="text-3xl font-bold text-blue-600 mb-1">{featuredListings}</p>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Featured</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center hover:shadow-sm transition-shadow">
                  <p className="text-3xl font-bold text-blue-600 mb-1">{totalViews}</p>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Views</p>
                </div>
              </div>
            </div>

            {/* Ratings & Reviews */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-800">Reputation</h2>
              </div>
              <div className="flex flex-col md:flex-row gap-8 items-center border-b border-slate-200 pb-8 mb-8">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-amber-500 mb-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <svg key={star} className={`w-8 h-8 ${star <= Math.round(activeAverageRating) ? 'text-amber-500' : 'text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-2xl font-bold text-slate-600">{activeAverageRating.toFixed(1)} <span className="text-sm font-normal text-slate-500">out of 5</span></p>
                  <p className="text-sm text-slate-500 mt-1">{activeTotalReviews} Reviews</p>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-6">
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div key={review.id} className="bg-slate-50 rounded-xl p-5 border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-white overflow-hidden flex items-center justify-center shrink-0 border border-slate-100">
                          {review.reviewer.avatar ? (
                            <Image src={review.reviewer.avatar} alt={review.reviewer.name} width={40} height={40} className="object-cover w-full h-full" />
                          ) : (
                            <span className="text-sm font-semibold text-slate-500">{review.reviewer.name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{review.reviewer.name}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex text-amber-500">
                              {[1, 2, 3, 4, 5].map(star => (
                                <svg key={star} className={`w-3 h-3 ${star <= review.rating ? 'text-amber-500' : 'text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                            <span className="text-xs text-slate-500">{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(review.createdAt)}</span>
                          </div>
                        </div>
                        {session?.user?.id === review.reviewer.id && (
                          <ProfileReviewEditButton
                            review={{ id: review.id, rating: review.rating, comment: review.comment }}
                            revieweeId={id}
                            conversationId={review.conversation.id}
                          />
                        )}
                      </div>
                      {review.comment && (
                        <p className="text-slate-600 text-sm ml-13">{review.comment}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-sm text-center">No reviews yet.</p>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Listings Section */}
        <div className="mb-8 border-b border-slate-200 pb-4">
          <h2 className="text-2xl font-bold text-slate-900">Active Listings</h2>
        </div>

        {listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {listings.map((listing: any) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-xl font-medium text-slate-800 mb-2">No active listings</h3>
            <p className="text-slate-500">This user has not published any advertising spaces yet.</p>
          </div>
        )}

      </main>
    </div>
  );
}
