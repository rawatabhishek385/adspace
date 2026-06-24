import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import DetailMap from "@/components/maps/DetailMap";
import ContactOwnerModal from "@/components/listings/ContactOwnerModal";
import ListingViewTracker from "@/components/listings/ListingViewTracker";
import ListingMediaGallery from "@/components/listings/ListingMediaGallery";
import ListingReviewButton from "@/components/reviews/ListingReviewButton";
import ReportListingButton from "@/components/reports/ReportListingButton";
import { FavoriteButton } from "@/components/listings/FavoriteButton";
import SimilarListingsSection from "@/components/listings/SimilarListingsSection";
import { Metadata } from "next";

interface ListingDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ListingDetailPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const listing = await prisma.listing.findFirst({
    where: { OR: [{ slug: id }, { id: id }], isActive: true },
    include: { category: true, media: true },
  });

  if (!listing) return { title: "Listing Not Found" };

  const primaryImage = listing.media.find(m => m.type === "IMAGE")?.url || "https://res.cloudinary.com/demo/image/upload/v1/adspace/banner.jpg";

  return {
    title: `${listing.title} | AdSpace Marketplace`,
    description: listing.description.substring(0, 160),
    openGraph: {
      title: listing.title,
      description: listing.description.substring(0, 160),
      images: [{ url: primaryImage }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: listing.title,
      description: listing.description.substring(0, 160),
      images: [primaryImage],
    },
  };
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const listing = await prisma.listing.findFirst({
    where: {
      OR: [{ slug: id }, { id: id }],
      isActive: true,
    },
    include: {
      owner: { select: { id: true, name: true, email: true, phone: true, avatar: true, city: true, country: true, createdAt: true, _count: { select: { listings: { where: { isActive: true } } } } } },
      category: { select: { id: true, name: true } },
      media: { select: { id: true, url: true, type: true } },
      _count: { select: { favorites: true } },
      listingReviews: {
        where: { isDeleted: false },
        include: { reviewer: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!listing) notFound();

  let hasEligibleConversation = false;
  let eligibleConversationId: string | null = null;
  let existingReview = null;
  let isFavorited = false;

  if (session?.user) {
    const favorite = await prisma.favorite.findUnique({
      where: { userId_listingId: { userId: session.user.id, listingId: listing.id } },
    });
    if (favorite) isFavorited = true;
    const conversations = await prisma.conversation.findMany({
      where: {
        listingId: listing.id,
        OR: [{ buyerId: session.user.id }, { ownerId: session.user.id }],
      },
      include: {
        _count: { select: { messages: true } },
      },
    });

    const eligibleConv = conversations.find(c => c._count.messages >= 2);
    if (eligibleConv) {
      hasEligibleConversation = true;
      eligibleConversationId = eligibleConv.id;
    }

    const reviewMatch = listing.listingReviews.find(r => r.reviewerId === session?.user?.id);
    if (reviewMatch) {
      existingReview = { id: reviewMatch.id, rating: reviewMatch.rating, comment: reviewMatch.comment };
    }
  }

  let hasReportedListing = false;
  if (session?.user) {
    const reportMatch = await prisma.report.findFirst({
      where: { listingId: listing.id, reporterId: session.user.id }
    });
    if (reportMatch) hasReportedListing = true;
  }

  // Sort media to put images first if desired, or just pass as is
  const media = listing.media;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <ListingViewTracker listingId={listing.id} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/listings" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-blue-500 transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Listings
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column — Media & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Interactive Media Gallery */}
            <ListingMediaGallery media={media as { id: string; url: string; type: "IMAGE" | "VIDEO" }[]} />

            {/* Description */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-3">Description</h2>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{listing.description}</p>
            </div>

            {/* Location & Map */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-3">Location</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <svg className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p>{listing.address}</p>
                    <p className="text-slate-500">{listing.city}, {listing.country}</p>
                  </div>
                </div>
                <DetailMap latitude={listing.latitude} longitude={listing.longitude} height={280} />
                {(listing.latitude !== 0 || listing.longitude !== 0) && (
                  <p className="text-xs text-slate-500">Coordinates: {listing.latitude.toFixed(6)}, {listing.longitude.toFixed(6)}</p>
                )}
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 mt-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-800">Listing Reviews</h2>
              </div>
              
              <div className="space-y-6">
                {listing.listingReviews.length > 0 ? (
                  listing.listingReviews.map((review) => (
                    <div key={review.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-white overflow-hidden flex items-center justify-center shrink-0 border border-slate-200">
                          {review.reviewer.avatar ? (
                            <img src={review.reviewer.avatar} alt={review.reviewer.name} className="object-cover w-full h-full" />
                          ) : (
                            <span className="text-sm font-semibold text-slate-500">{review.reviewer.name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{review.reviewer.name}</p>
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
                  <p className="text-slate-500 text-sm text-center">No reviews yet.</p>
                )}
              </div>
            </div>

          </div>

          {/* Right Column — Sidebar */}
          <div className="space-y-6">
            {/* Title & Price */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
              <div className="flex justify-between items-start mb-3">
                <span className="inline-block px-3 py-1 text-xs font-medium bg-blue-100 text-blue-500 rounded-full">
                  {listing.category.name}
                </span>
                <FavoriteButton listingId={listing.id} initialIsFavorited={isFavorited} />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 mb-4">{listing.title}</h1>
              
              {/* Rating Summary */}
              {listing.totalRatings > 0 ? (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center text-amber-500">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="ml-1 font-bold text-slate-800">{listing.averageRating.toFixed(1)}</span>
                  </div>
                  <span className="text-slate-500 text-sm">{listing.totalRatings} Reviews</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-4 text-sm text-slate-500">
                  <span>No reviews yet</span>
                </div>
              )}

              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-3xl font-bold text-blue-500">₹{listing.price.toLocaleString("en-IN")}</span>
                <span className="text-slate-500">/ {listing.pricePeriod}</span>
              </div>
              
              {listing._count && listing._count.favorites > 0 && (
                <div className="text-sm font-medium text-slate-500">
                  ❤️ {listing._count.favorites} Saves
                </div>
              )}
            </div>

            {/* Specifications */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
              <h3 className="text-sm font-medium text-slate-500 mb-4">Specifications</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Type</span>
                  <span className="text-slate-800">{listing.indoorOutdoor}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Format</span>
                  <span className="text-slate-800">{listing.digitalPhysical}</span>
                </div>
                {listing.width && listing.height && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Dimensions</span>
                    <span className="text-slate-800">{listing.width} × {listing.height} ft</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Location</span>
                  <span className="text-slate-800">{listing.city}, {listing.country}</span>
                </div>
              </div>
            </div>

            {/* Owner Card */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
              <h3 className="text-sm font-medium text-slate-500 mb-4">Listed By</h3>
              <div className="flex items-start gap-4">
                <div className="relative w-12 h-12 rounded-full bg-white border-2 border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                  {listing.owner.avatar ? (
                    <img src={listing.owner.avatar} alt={listing.owner.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-blue-500 font-semibold text-lg">{listing.owner.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-slate-700 font-medium">{listing.owner.name}</p>
                  {(listing.owner.city || listing.owner.country) && (
                    <p className="text-xs text-slate-500 mt-0.5">{listing.owner.city}{listing.owner.city && listing.owner.country ? ", " : ""}{listing.owner.country}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    Member since {new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short" }).format(listing.owner.createdAt)} • {listing.owner._count.listings} Active Listings
                  </p>
                </div>
              </div>
              
              <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-3">
                <Link href={`/profile/${listing.ownerId}`} className="w-full py-2 bg-white hover:bg-slate-700 text-slate-800 hover:text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  View Public Profile
                </Link>
                {session?.user?.id !== listing.ownerId && (
                  <ListingReviewButton 
                    listingId={listing.id}
                    isOwner={session?.user?.id === listing.ownerId}
                    hasEligibleConversation={hasEligibleConversation}
                    conversationId={eligibleConversationId}
                    existingReview={existingReview}
                  />
                )}
                <ReportListingButton
                  listingId={listing.id}
                  isOwner={session?.user?.id === listing.ownerId}
                  isLoggedIn={!!session?.user}
                />

              {listing.owner.phone && (() => {
                const phone = listing.owner.phone;
                const isMasked = session?.user?.id !== listing.ownerId;
                const displayPhone = isMasked && phone.length > 2
                  ? `${phone.slice(0, 2)}${"*".repeat(phone.length - 4)}${phone.slice(-2)}`
                  : phone;

                return (
                  <div className="flex flex-col gap-1 w-full mt-1">
                    {isMasked ? (
                      <div className="flex items-center justify-center gap-2 text-sm text-slate-500 py-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {displayPhone}
                      </div>
                    ) : (
                      <a href={`tel:${phone}`} className="flex items-center justify-center gap-2 text-sm text-blue-500 hover:text-blue-600 transition-colors py-1.5 bg-blue-50 rounded-lg">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {displayPhone}
                      </a>
                    )}
                    {isMasked && (
                      <p className="text-[10px] text-slate-500 mt-1 text-center">
                        {!session?.user ? (
                          <><Link href={`/login?callbackUrl=/listings/${listing.slug}`} className="text-blue-500 hover:underline">Log in</Link>{" "}to see full phone number</>
                        ) : (
                          <>Phone number is hidden for privacy</>
                        )}
                      </p>
                    )}
                  </div>
                );
              })()}
              </div>
            </div>

            {/* Contact Button */}
            {hasReportedListing ? (
              <div className="w-full py-3 bg-red-50 text-red-500 font-medium rounded-xl border border-red-500/10 text-sm flex justify-center items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Reported
              </div>
            ) : (
              <ContactOwnerModal
                listingId={listing.id}
                ownerId={listing.ownerId}
                listingTitle={listing.title}
                isLoggedIn={!!session?.user}
                currentUserId={session?.user?.id}
              />
            )}
          </div>
        </div>

        {/* Similar Listings */}
        <SimilarListingsSection listingId={listing.id} />
      </main>
    </div>
  );
}
