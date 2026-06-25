import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import InfluencerCard from "./InfluencerCard";
import OutreachSearchClient from "./OutreachSearchClient";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { getUserCountry } from "@/lib/getUserCountry";

import { Metadata } from "next";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; type?: string; country?: string; city?: string }>;
}): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const { q, type, country, city } = resolvedParams;

  let title = "Browse Influencers & Agencies | AdSpace Outreach";
  let description = "Find top-rated digital marketers, agencies, and influencers for your ad campaigns.";

  if (type === "DIGITAL_MARKETER") {
    title = "Browse Digital Agencies | AdSpace Outreach";
  } else if (type === "CONTENT_CREATOR") {
    title = "Browse Content Creators | AdSpace Outreach";
  }

  if (city && country) {
    title = `${title} in ${city}, ${country}`;
  } else if (country) {
    title = `${title} in ${country}`;
  }

  if (q) {
    title = `${q} | ${title}`;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function BrowseInfluencersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; price?: string; type?: string; country?: string; city?: string }>;
}) {
  const resolvedParams = await searchParams;
  const { q, category, price, type, country, city } = resolvedParams;

  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";

  let loggedInUserCountry = null;
  if (session?.user?.id && !isAdmin) {
    loggedInUserCountry = await getUserCountry(session.user.id);
  }

  const hasExplicitCountry = "country" in resolvedParams;
  const explicitCountry = typeof country === "string" ? country : "";
  const effectiveCountry = hasExplicitCountry ? explicitCountry : (loggedInUserCountry || "");

  const whereClause: Prisma.InfluencerProfileWhereInput = {
    status: "APPROVED",
    isPublic: true,
  };

  // Filter by type (INDIVIDUAL or DIGITAL_MARKETER)
  if (type === "INDIVIDUAL" || type === "DIGITAL_MARKETER") {
    whereClause.type = type;
  }

  if (category) {
    whereClause.category = { contains: category };
  }
  if (price) {
    whereClause.pricePerPost = { lte: parseFloat(price) };
  }
  const andConditions: Prisma.InfluencerProfileWhereInput[] = [];

  if (effectiveCountry) {
    andConditions.push({ user: { country: { contains: effectiveCountry } } });
  }

  if (city) {
    andConditions.push({
      OR: [
        { city: { contains: city } },
        { user: { city: { contains: city } } }
      ]
    });
  }

  if (q) {
    andConditions.push({
      OR: [
        { user: { name: { contains: q } } },
        { companyName: { contains: q } },
        { description: { contains: q } },
      ]
    });
  }

  if (andConditions.length > 0) {
    whereClause.AND = andConditions;
  }

  let isAlreadyInfluencer = false;

  if (session?.user?.id) {
    const existingProfile = await prisma.influencerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (existingProfile) {
      isAlreadyInfluencer = true;
    }
  }

  const profiles = await prisma.influencerProfile.findMany({
    where: whereClause,
    include: {
      user: {
        select: { name: true, email: true, avatar: true, isOnline: true, lastSeen: true },
      },
    },
    orderBy: { followers: "desc" },
  });

  // Count by type for display
  const totalCount = profiles.length;
  const heading = type === "INDIVIDUAL" 
    ? "Browse Influencers" 
    : type === "DIGITAL_MARKETER" 
      ? "Browse Digital Marketing Services" 
      : "Browse All Creators & Agencies";

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">{heading}</h1>
            <p className="mt-2 text-slate-600">
              {totalCount} {totalCount === 1 ? "profile" : "profiles"} found
              {type === "INDIVIDUAL" && " — Individual Creators"}
              {type === "DIGITAL_MARKETER" && " — Companies"}
            </p>
          </div>
          {!isAlreadyInfluencer && (
            <Link href="/outreach/apply" className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors shadow-sm inline-flex items-center gap-2">
              Become an Influencer
            </Link>
          )}
        </div>

        <OutreachSearchClient 
          initialQ={q} 
          initialPrice={price}
          initialType={type}
          initialCountry={country}
          initialCity={city}
          defaultCountry={effectiveCountry || loggedInUserCountry || ""}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {profiles.length > 0 ? (
            profiles.map((profile) => (
              <InfluencerCard key={profile.id} profile={profile} />
            ))
          ) : (
            <div className="col-span-full py-24 text-center bg-white rounded-2xl border border-slate-200">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">No profiles found</h3>
              <p className="text-slate-500">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
