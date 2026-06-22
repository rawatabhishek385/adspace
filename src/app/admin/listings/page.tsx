import { prisma } from "@/lib/prisma";
import { ListingModerationTable } from "./ListingModerationTable";

export default async function AdminListingsPage() {
  const listings = await prisma.listing.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      category: { select: { id: true, name: true } },
      media: { select: { id: true, url: true, type: true }, take: 1 },
      _count: { select: { reports: true } },
    },
  });

  // Serialize Dates to strings for client component
  const serialized = JSON.parse(JSON.stringify(listings));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Listing Moderation</h2>
          <p className="mt-1 text-slate-400 text-sm">
            {listings.length} total {listings.length === 1 ? "listing" : "listings"} on the platform
          </p>
        </div>
      </div>

      <ListingModerationTable initialListings={serialized} />
    </div>
  );
}
