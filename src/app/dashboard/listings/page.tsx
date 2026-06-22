import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { MyListingsClient } from "./MyListingsClient";

export default async function MyListingsPage() {
  const user = await requireAuth();

  const listings = await prisma.listing.findMany({
    where: { ownerId: user.id },
    include: {
      owner: { select: { id: true, name: true, email: true, phone: true } },
      category: { select: { id: true, name: true } },
      media: { select: { id: true, url: true, type: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My Listings</h2>
          <p className="mt-1 text-slate-500 text-sm">{listings.length} listing{listings.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/dashboard/listings/create"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
        >
          + New Listing
        </Link>
      </div>
      <MyListingsClient initialListings={JSON.parse(JSON.stringify(listings))} />
    </div>
  );
}
