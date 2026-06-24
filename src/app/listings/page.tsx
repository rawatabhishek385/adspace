import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { getUserCountry } from "@/lib/getUserCountry";
import SearchBar from "@/components/listings/SearchBar";
import ListingFilters from "@/components/listings/ListingFilters";
import Pagination from "@/components/listings/Pagination";
import ListingViewToggle from "@/components/listings/ListingViewToggle";
import SaveSearchButton from "@/components/search/SaveSearchButton";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Advertising Spaces | AdSpace Marketplace",
  description: "Browse and filter premium advertising spaces by location, category, and price.",
};

// Next.js config for search params
export const dynamic = "force-dynamic";

export default async function ListingsSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  const search = typeof params.search === "string" ? params.search : "";
  const city = typeof params.city === "string" ? params.city : "";
  const categoryId = typeof params.categoryId === "string" ? params.categoryId : "";
  const minPrice = typeof params.minPrice === "string" ? params.minPrice : "";
  const maxPrice = typeof params.maxPrice === "string" ? params.maxPrice : "";
  const sort = typeof params.sort === "string" ? params.sort : "newest";
  const favoritesOnly = typeof params.favoritesOnly === "string" ? params.favoritesOnly : "false";
  const page = parseInt(typeof params.page === "string" ? params.page : "1", 10) || 1;
  const limit = parseInt(typeof params.limit === "string" ? params.limit : "12", 10) || 12;

  const latStr = typeof params.lat === "string" ? params.lat : "";
  const lngStr = typeof params.lng === "string" ? params.lng : "";
  const radiusStr = typeof params.radius === "string" ? params.radius : "50";
  const userLat = latStr ? parseFloat(latStr) : null;
  const userLng = lngStr ? parseFloat(lngStr) : null;
  const radius = parseFloat(radiusStr);

  // ─── Region filtering logic ────────────────────────────────────────
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";

  // Get the user's country from the DB (for non-admin logged-in users)
  const userCountry = session?.user?.id && !isAdmin
    ? await getUserCountry(session.user.id)
    : null;

  // Determine the effective country filter:
  // - If the URL has an explicit `country` param, use that (user changed the dropdown)
  // - If no `country` param in URL, default to the user's country (for non-admin users)
  // - If `country` param is empty string "", show all countries (user selected "All Countries")
  const hasExplicitCountry = "country" in params;
  const explicitCountry = typeof params.country === "string" ? params.country : "";

  let effectiveCountry = "";
  if (hasExplicitCountry) {
    // User explicitly set a country filter (could be "" for "All Countries")
    effectiveCountry = explicitCountry;
  } else {
    // No explicit filter → default to user's country
    effectiveCountry = userCountry || "";
  }

  // Build Prisma query
  const where: Record<string, unknown> = { isActive: true };

  if (effectiveCountry) where.country = { contains: effectiveCountry };
  if (city) where.city = { contains: city };
  if (categoryId) where.categoryId = categoryId;
  if (favoritesOnly === "true" && session?.user?.id) {
    where.favorites = { some: { userId: session.user.id } };
  }

  if (minPrice || maxPrice) {
    const priceFilter: Record<string, number> = {};
    if (minPrice) priceFilter.gte = parseFloat(minPrice);
    if (maxPrice) priceFilter.lte = parseFloat(maxPrice);
    where.price = priceFilter;
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { city: { contains: search } },
      { country: { contains: search } },
      { address: { contains: search } },
    ];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderBy: any[] = [{ isFeatured: "desc" }];
  if (sort === "oldest") orderBy.push({ createdAt: "asc" });
  else if (sort === "price_asc") orderBy.push({ price: "asc" });
  else if (sort === "price_desc") orderBy.push({ price: "desc" });
  else orderBy.push({ createdAt: "desc" });

  // Fetch distinct countries for the filter dropdown
  const allCountries = await prisma.listing.findMany({
    where: { isActive: true },
    select: { country: true },
    distinct: ["country"],
    orderBy: { country: "asc" },
  });
  const countryList = allCountries.map((l) => l.country).filter(Boolean);

  let categories;
  let finalTotal = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let finalListings: any[] = [];

  if (userLat !== null && userLng !== null && !isNaN(userLat) && !isNaN(userLng)) {
    const { haversineDistance, formatDistance } = await import("@/lib/geo");
    const [fetchedCategories, allListings] = await Promise.all([
      prisma.category.findMany({ orderBy: { name: "asc" } }),
      prisma.listing.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
          media: { select: { id: true, url: true, publicId: true, type: true } },
        },
      }),
    ]);
    categories = fetchedCategories;

    const listingsWithDistance = allListings.map(listing => {
      const dist = haversineDistance(userLat, userLng, listing.latitude, listing.longitude);
      return {
        ...listing,
        distance: Math.round(dist * 10) / 10,
        distanceText: formatDistance(dist),
      };
    }).filter(l => l.distance <= radius);

    if (sort === "oldest") listingsWithDistance.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    else if (sort === "price_asc") listingsWithDistance.sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") listingsWithDistance.sort((a, b) => b.price - a.price);
    else if (sort === "distance") listingsWithDistance.sort((a, b) => a.distance - b.distance);
    else {
      listingsWithDistance.sort((a, b) => {
        if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
        return a.distance - b.distance;
      });
    }

    finalTotal = listingsWithDistance.length;
    finalListings = listingsWithDistance.slice((page - 1) * limit, page * limit);
  } else {
    const [fetchedCategories, fetchedListings, fetchedTotal] = await Promise.all([
      prisma.category.findMany({ orderBy: { name: "asc" } }),
      prisma.listing.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
          media: { select: { id: true, url: true, publicId: true, type: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.listing.count({ where }),
    ]);
    categories = fetchedCategories;
    finalListings = fetchedListings;
    finalTotal = fetchedTotal;
  }

  const totalPages = Math.ceil(finalTotal / limit);

  // Prepare map data from existing coordinates
  const mapListings = finalListings.map((l) => ({
    id: l.id,
    slug: l.slug,
    title: l.title,
    price: l.price,
    pricePeriod: l.pricePeriod,
    city: l.city,
    latitude: l.latitude,
    longitude: l.longitude,
    category: l.category.name,
    imageUrl: l.media.find((m: { type: string }) => m.type === "IMAGE")?.url,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header & Search Bar */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-slate-800">Explore Ad Spaces</h1>
            <SaveSearchButton />
          </div>
          <p className="text-slate-500 mb-6">Find and filter the perfect advertising space for your next campaign.</p>
          <SearchBar defaultCountry={effectiveCountry || userCountry || undefined} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Sidebar Filters */}
          <div className="lg:col-span-1 lg:sticky lg:top-8">
            <ListingFilters 
              categories={categories} 
              countries={countryList}
              defaultCountry={effectiveCountry || userCountry || ""}
            />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {finalListings.length > 0 ? (
              <ListingViewToggle
                listings={finalListings as never[]}
                mapListings={mapListings}
              >
                <Pagination currentPage={page} totalPages={totalPages} totalItems={finalTotal} />
              </ListingViewToggle>
            ) : (
              <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 sm:p-16 text-center">
                <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">No listings found</h3>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                  We couldn&apos;t find any ad spaces matching your current filters. Try adjusting your search criteria or clearing filters.
                </p>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
