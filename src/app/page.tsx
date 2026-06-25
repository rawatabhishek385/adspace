import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { getUserCountry } from "@/lib/getUserCountry";
import { ListingCard } from "@/components/listings/ListingCard";
import FeaturedMap from "@/components/maps/FeaturedMap";
import CategoryMarquee from "@/components/home/CategoryMarquee";
import RecommendedListingsSection from "@/components/home/RecommendedListingsSection";
import NearbyListingsSection from "@/components/location/NearbyListingsSection";
import TrendingNearYou from "@/components/location/TrendingNearYou";
import SearchBar from "@/components/search/SearchBar";
import RecentlyViewedSection from "@/components/home/RecentlyViewedSection";
import type { ListingWithRelations } from "@/types/listing.types";
import { Metadata } from "next";
import ScamAwarenessPopupWrapper from "@/components/safety/ScamAwarenessPopupWrapper";
import StructuredData from "@/components/seo/StructuredData";

export const metadata: Metadata = {
  title: "AdSpace Marketplace | Rent Premium Advertising Spaces",
  description: "Find and rent the best outdoor billboards, digital signage, and LED displays for your advertising campaigns.",
  keywords: ["advertising space", "rent billboard", "digital signage", "LED display", "outdoor advertising"],
  openGraph: {
    title: "AdSpace Marketplace",
    description: "Find and rent the best outdoor billboards, digital signage, and LED displays for your advertising campaigns.",
    url: "https://adspace-marketplace.com",
    siteName: "AdSpace",
    images: [
      {
        url: "https://res.cloudinary.com/demo/image/upload/v1/adspace/banner.jpg",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AdSpace Marketplace",
    description: "Rent premium advertising spaces instantly.",
    images: ["https://res.cloudinary.com/demo/image/upload/v1/adspace/banner.jpg"],
  },
};

export const revalidate = 60; // Cache the home page queries for 60 seconds (ISR)

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  const includeListingRelations = {
    owner: { select: { id: true, name: true } },
    category: { select: { id: true, name: true } },
    media: { select: { id: true, url: true, publicId: true, type: true } },
    _count: { select: { favorites: true } },
  };

  // Region filtering: logged-in non-admin users see their country's listings by default
  const isAdmin = session?.user?.role === "ADMIN";
  const userCountry = session?.user?.id && !isAdmin
    ? await getUserCountry(session.user.id)
    : null;

  const regionFilter = userCountry ? { country: { contains: userCountry } } : {};

  const [categories, popularListings, savedListings, latestListings, userFavorites] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { listings: true } } },
    }),
    prisma.listing.findMany({
      where: { isActive: true, averageRating: { gte: 4 }, ...regionFilter },
      include: includeListingRelations,
      orderBy: { trendingScore: "desc" },
      take: 8,
    }),
    session?.user?.id ? prisma.listing.findMany({
      where: { isActive: true, favorites: { some: { userId: session.user.id } } },
      include: includeListingRelations,
      orderBy: { createdAt: "desc" },
      take: 8,
    }) : Promise.resolve([]),
    prisma.listing.findMany({
      where: { isActive: true, ...regionFilter },
      include: includeListingRelations,
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    session?.user?.id
      ? prisma.favorite.findMany({ where: { userId: session.user.id }, select: { listingId: true } })
      : Promise.resolve([]),
  ]);

  const userFavoritedIds = new Set(userFavorites.map(f => f.listingId));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "AdSpace Marketplace",
    "url": process.env.NEXTAUTH_URL || "https://adspace-marketplace.com",
    "description": "Find and rent the best outdoor billboards, digital signage, and LED displays for your advertising campaigns.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${process.env.NEXTAUTH_URL || "https://adspace-marketplace.com"}/listings?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <StructuredData data={jsonLd} />
      <ScamAwarenessPopupWrapper />

      {/* ─── Hero Section ────────────────────────────────────────────── */}
      <section className="relative pt-8 pb-8 lg:pt-4 lg:pb-4 overflow-hidden bg-white min-h-[calc(100vh-64px)] flex items-center mb-16">

        {/* Full Section Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/home/home.png"
            alt="Ad Space Marketplace Hero Background"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        </div>
        
        {/* Mobile/Tablet Overlay for better text readability */}
        <div className="absolute inset-0 z-0 bg-white/70 lg:bg-transparent pointer-events-none"></div>
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-white/95 via-white/70 to-white/90 lg:hidden pointer-events-none"></div>

        <div className="max-w-[1400px] mx-auto w-full px-4 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Column Content */}
          <div className="max-w-xl py-4 lg:py-0">
            <div className="inline-flex max-w-full items-start sm:items-center gap-1.5 px-3 py-1 bg-blue-50/90 backdrop-blur-md rounded-2xl sm:rounded-full text-blue-600 text-xs sm:text-sm font-medium mb-4 shadow-sm border border-blue-100">
              
              <span className="leading-tight">Asia's Leading Advertising Space Marketplace</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-[#0F172A] leading-[1.1] tracking-tight mb-4 break-words">
              Rent and Discover <br className="hidden sm:block" />
              <span className="text-blue-500">Advertising Spaces</span> <br className="hidden sm:block" />
              Worldwide
            </h1>
            <p className="text-base sm:text-lg text-slate-1800 mb-6 max-w-lg leading-relaxed font-medium">
              Find digital screens, billboards, wall advertising spaces, and outdoor
              advertising locations. Connect directly with space owners.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-8 w-full sm:w-fit flex-wrap">
              <Link
                href="#listings"
                className="inline-flex justify-center items-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/20 w-full sm:w-auto"
              >
                Browse Spaces <span className="ml-2">→</span>
              </Link>
              <Link
                href="/outreach/browse"
                className="inline-flex justify-center items-center px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-xl transition-colors shadow-lg shadow-purple-500/20 w-full sm:w-auto"
              >
                Find Influencers <span className="ml-2">→</span>
              </Link>
              <Link
                href={session ? "/dashboard/listings/create" : "/register"}
                className="inline-flex justify-center items-center px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-xl border border-slate-200 transition-colors shadow-sm w-full sm:w-auto"
              >
                List Your Space <span className="ml-2">+</span>
              </Link>
            </div>

            <div className="mb-8">
              <SearchBar />
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-4 sm:gap-8 items-center border-t border-slate-200/50 pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shadow-sm">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-lg leading-tight">10K+</div>
                  <div className="text-[11px] text-slate-600 font-bold uppercase tracking-wider">Active Listings</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 shadow-sm">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-lg leading-tight">5K+</div>
                  <div className="text-[11px] text-slate-600 font-bold uppercase tracking-wider">Verified Owners</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shadow-sm">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-lg leading-tight">50+</div>
                  <div className="text-[11px] text-slate-600 font-bold uppercase tracking-wider">Countries</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column Content - Empty or for future illustration */}
          <div className="hidden lg:block relative h-full min-h-[400px]">
            {/* Optional floating elements or illustration */}
          </div>
        </div>

        {/* Scam Awareness Popup Overlay */}
        {/* Cache busted! */}
        <ScamAwarenessPopupWrapper />
      </section>

      {/* ─── Premium Categories Section ──────────────────────────────────────── */}
      <section className="w-full bg-slate-50 py-16 mb-24 border-y border-slate-200">
        <div className="px-4 max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-0.5 bg-blue-500 rounded-full"></div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-wide">Explore Popular Categories</h2>
            </div>
            <Link href="/listings" className="text-sm font-medium text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1">
              View All Categories <span className="text-lg">→</span>
            </Link>
          </div>
        </div>
        <CategoryMarquee categories={categories} />
      </section>

      {/* ─── Recommended Listings Section ───────────────────────────────────── */}
      <RecommendedListingsSection />

      {/* ─── Nearby Listings Section ──────────────────────────────────────── */}
      <NearbyListingsSection />

      {/* ─── Trending Near You ─────────────────────────────────────────── */}
      <TrendingNearYou />

      {/* ─── Discovery Sections ──────────────────────────────────────── */}
      <div id="listings" className="px-4 max-w-7xl mx-auto space-y-20 mb-20">

        {/* Section 0: Recently Viewed */}
        <RecentlyViewedSection />

        {/* Section 1: Popular Listings */}
        {popularListings.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">🔥 Trending Spaces</h2>
                <p className="mt-1 text-slate-500">The hottest spaces right now based on views and engagement</p>
              </div>
            </div>
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 hide-scrollbar">
              {popularListings.map((listing) => (
                <div key={listing.id} className="min-w-[85vw] sm:min-w-0 snap-center sm:snap-align-none">
                  <ListingCard
                    listing={listing as ListingWithRelations}
                    isFavorited={userFavoritedIds.has(listing.id)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 2: Your Saved Listings */}
        {savedListings.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">❤️ Your Saved Listings</h2>
                <p className="mt-1 text-slate-500">Spaces you have favorited</p>
              </div>
            </div>
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 hide-scrollbar">
              {savedListings.map((listing) => (
                <div key={listing.id} className="min-w-[85vw] sm:min-w-0 snap-center sm:snap-align-none">
                  <ListingCard
                    listing={listing as ListingWithRelations}
                    isFavorited={userFavoritedIds.has(listing.id)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 3: Latest Listings */}
        {latestListings.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-800"> Latest Advertising Spaces</h2>
                <p className="mt-1 text-slate-500">Recently added to the marketplace</p>
              </div>
              <Link href="/listings" className="text-sm text-blue-500 hover:text-blue-600 transition-colors flex items-center gap-1">
                View all
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 hide-scrollbar">
              {latestListings.map((listing) => (
                <div key={listing.id} className="min-w-[85vw] sm:min-w-0 snap-center sm:snap-align-none">
                  <ListingCard
                    listing={listing as ListingWithRelations}
                    isFavorited={userFavoritedIds.has(listing.id)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ─── Platform Navigation Cards ─────────────────────────────── */}
      <section className="px-4 mb-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/20 to-transparent pointer-events-none -z-10" />
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16 flex flex-col items-center">
            <span className="inline-block px-4 py-1.5 bg-blue-100/50 text-blue-600 font-bold text-xs tracking-widest rounded-full mb-4 uppercase">
              ALL-IN-ONE PLATFORM
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold text-slate-800 mb-4 tracking-tight relative">
              Explore the <span className="text-blue-600 relative inline-block">
                Platform
                {/* Decorative Sparkle icon */}
                <svg className="absolute -top-4 -right-10 w-8 h-8 text-amber-400 rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </span>
            </h2>
            <p className="text-lg text-slate-500 font-medium">Everything you need to buy or sell ad spaces</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            
            {/* Card 1: Browse Listings */}
            <Link href="/listings" className="group bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-slate-100 flex flex-col h-full">
              <div className="h-[220px] w-full bg-gradient-to-br from-blue-50 to-blue-100/50 flex items-center justify-center p-6 relative">
                <div className="absolute top-4 left-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-500">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <Image src="/images/ui/explore_browse_1781851760518.png" alt="Browse Listings" width={400} height={220} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" />
              </div>
              <div className="p-8 flex-grow flex flex-col justify-between bg-white relative z-10">
                <div>
                  <h3 className="text-blue-600 font-bold text-2xl tracking-tight mb-3">Browse Listings</h3>
                  <p className="text-slate-500 text-[15px] font-medium leading-relaxed">Search all ad spaces by location, type, or price.</p>
                </div>
                <div className="mt-8 flex items-center gap-3 text-blue-600 font-bold text-[15px]">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30 group-hover:scale-110 transition-transform"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg></div>
                  Explore Now
                </div>
              </div>
            </Link>

            {/* Card 2: List Your Space */}
            <Link href={session ? "/dashboard/listings/create" : "/register"} className="group bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-slate-100 flex flex-col h-full">
              <div className="h-[220px] w-full bg-gradient-to-br from-green-50 to-green-100/50 flex items-center justify-center p-6 relative">
                <div className="absolute top-4 left-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-green-500">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                </div>
                <Image src="/images/ui/explore_list_1781851772205.png" alt="List Your Space" width={400} height={220} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" />
              </div>
              <div className="p-8 flex-grow flex flex-col justify-between bg-white relative z-10">
                <div>
                  <h3 className="text-emerald-500 font-bold text-2xl tracking-tight mb-3">List Your Space</h3>
                  <p className="text-slate-500 text-[15px] font-medium leading-relaxed">Create a listing and start earning from your ad space.</p>
                </div>
                <div className="mt-8 flex items-center gap-3 text-emerald-500 font-bold text-[15px]">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30 group-hover:scale-110 transition-transform"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg></div>
                  Get Started
                </div>
              </div>
            </Link>

            {/* Card 3: Your Dashboard */}
            <Link href={session ? "/dashboard" : "/login"} className="group bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-slate-100 flex flex-col h-full">
              <div className="h-[220px] w-full bg-gradient-to-br from-purple-50 to-purple-100/50 flex items-center justify-center p-6 relative">
                <div className="absolute top-4 left-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-purple-500">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                </div>
                <Image src="/images/ui/explore_dashboard_1781851783076.png" alt="Your Dashboard" width={400} height={220} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" />
              </div>
              <div className="p-8 flex-grow flex flex-col justify-between bg-white relative z-10">
                <div>
                  <h3 className="text-purple-600 font-bold text-2xl tracking-tight mb-3">Your Dashboard</h3>
                  <p className="text-slate-500 text-[15px] font-medium leading-relaxed">Manage your listings and track performance in one place.</p>
                </div>
                <div className="mt-8 flex items-center gap-3 text-purple-600 font-bold text-[15px]">
                  <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/30 group-hover:scale-110 transition-transform"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg></div>
                  Go to Dashboard
                </div>
              </div>
            </Link>

            {/* Card 4: Join Free */}
            <Link href="/register" className="group bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 border border-slate-100 flex flex-col h-full">
              <div className="h-[220px] w-full bg-gradient-to-br from-orange-50 to-orange-100/50 flex items-center justify-center p-6 relative">
                <div className="absolute top-4 left-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-orange-500">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                </div>
                <Image src="/images/ui/explore_join_1781851793597.png" alt="Join Free" width={400} height={220} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" />
              </div>
              <div className="p-8 flex-grow flex flex-col justify-between bg-white relative z-10">
                <div>
                  <h3 className="text-orange-500 font-bold text-2xl tracking-tight mb-3">Join Free</h3>
                  <p className="text-slate-500 text-[15px] font-medium leading-relaxed">Sign up and connect with space owners today.</p>
                </div>
                <div className="mt-8 flex items-center gap-3 text-orange-500 font-bold text-[15px]">
                  <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/30 group-hover:scale-110 transition-transform"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg></div>
                  Join Now
                </div>
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* ─── How It Works ────────────────────────────────────────────── */}
      <section className="px-4 mb-10">
        <div className="max-w-[1400px] mx-auto bg-slate-50/80 rounded-[3rem] p-10 md:p-16 border border-slate-100">
          <div className="text-center mb-16 flex flex-col items-center">
            <span className="inline-block px-4 py-1.5 bg-blue-100/50 text-blue-600 font-bold text-xs tracking-widest rounded-full mb-4 uppercase">
              EASY & SIMPLE
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-4 tracking-tight">
              How It <span className="text-blue-600">Works</span>
            </h2>
            <p className="text-lg text-slate-500 font-medium">Get started in three simple steps</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-[40%] left-[15%] right-[15%] h-0.5 border-t-2 border-dashed border-blue-200 -z-0"></div>
            
            <div className="relative bg-white rounded-[2rem] p-8 text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 flex flex-col items-center z-10">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-blue-600/30">
                01
              </div>
              <div className="h-40 w-full mb-6 flex justify-center items-center">
                <Image src="/images/ui/step_search_1781851821089.png" alt="Find Your Space" width={200} height={160} className="h-full object-contain hover:scale-105 transition-transform duration-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3 text-center">Find Your Space</h3>
              <p className="text-[15px] text-slate-500 text-center font-medium leading-relaxed">Browse thousands of verified ad spaces that fit your location and budget.</p>
              <div className="mt-6 w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
              </div>
            </div>

            <div className="relative bg-white rounded-[2rem] p-8 text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 flex flex-col items-center z-10">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-emerald-500/30">
                02
              </div>
              <div className="h-40 w-full mb-6 flex justify-center items-center">
                <Image src="/images/ui/step_handshake_1781851831189.png" alt="Connect & Book" width={200} height={160} className="h-full object-contain hover:scale-105 transition-transform duration-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3 text-center">Connect & Book</h3>
              <p className="text-[15px] text-slate-500 text-center font-medium leading-relaxed">Connect with space owners and book the perfect spot for your brand.</p>
              <div className="mt-6 w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
              </div>
            </div>

            <div className="relative bg-white rounded-[2rem] p-8 text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 flex flex-col items-center z-10">
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-amber-500/30">
                03
              </div>
              <div className="h-40 w-full mb-6 flex justify-center items-center">
                <Image src="/images/ui/step_chart_1781851843264.png" alt="Advertise & Grow" width={200} height={160} className="h-full object-contain hover:scale-105 transition-transform duration-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3 text-center">Advertise & Grow</h3>
              <p className="text-[15px] text-slate-500 text-center font-medium leading-relaxed">Launch your campaign and grow your brand with high visibility.</p>
              <div className="mt-6 w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
              </div>
            </div>
          </div>
          
          {/* Features Strip */}
          <div className="mt-16 pt-10 border-t border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Verified Listings</h4>
                <p className="text-xs text-slate-500">100% verified and trusted spaces</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 text-lg">
                <span className="font-bold">₹</span>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Best Pricing</h4>
                <p className="text-xs text-slate-500">Competitive prices & great deals</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">24/7 Support</h4>
                <p className="text-xs text-slate-500">We're here to help anytime</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Secure Payments</h4>
                <p className="text-xs text-slate-500">Safe and secure transactions</p>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* ─── Featured Locations Map ────────────────────────────────── */}
      {latestListings.length > 0 && (
        <section className="px-4 mb-20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-800">Discover on Map</h2>
              <p className="mt-2 text-slate-500">Explore advertising spaces across India</p>
            </div>
            <FeaturedMap
              listings={latestListings.map((l) => ({
                id: l.id,
                slug: l.slug,
                title: l.title,
                price: l.price,
                pricePeriod: l.pricePeriod,
                city: l.city,
                latitude: l.latitude,
                longitude: l.longitude,
                category: l.category.name,
                imageUrl: l.media.find((m) => m.type === "IMAGE")?.url,
              }))}
            />
          </div>
        </section>
      )}

      {/* ─── CTA Section ─────────────────────────────────────────────── */}
      <section className="px-4 mb-20">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-r from-blue-500 to-teal-500 rounded-3xl p-6 sm:p-12 text-center overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl font-bold text-white mb-4">Start Earning From Your Advertising Space</h2>
              <p className="text-blue-100 mb-8 max-w-lg mx-auto">
                Join thousands of space owners who are monetizing their billboards, walls, and digital screens.
              </p>
              <Link
                href={session ? "/dashboard/listings/create" : "/register"}
                className="inline-block w-full sm:w-auto px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/25"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
