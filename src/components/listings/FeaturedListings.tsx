import { prisma } from "@/lib/prisma";
import { ListingCard } from "@/components/listings/ListingCard";

export default async function FeaturedListings({ limit = 3 }: { limit?: number }) {
  const featuredListings = await prisma.listing.findMany({
    where: { isActive: true, isFeatured: true },
    include: {
      owner: { select: { id: true, name: true, email: true, phone: true } },
      category: { select: { id: true, name: true } },
      media: { select: { id: true, url: true, publicId: true, type: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  if (featuredListings.length === 0) {
    return null; // Return nothing if no featured listings exist
  }

  return (
    <section className="mb-20">
      <div className="flex items-center gap-3 mb-10">
        <span className="text-2xl">⭐</span>
        <div>
          <h2 className="text-3xl font-bold text-white">Featured Spaces</h2>
          <p className="mt-1 text-slate-500">Premium advertising spaces hand-picked for you</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuredListings.map((listing) => (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <ListingCard key={listing.id} listing={listing as any} />
        ))}
      </div>
    </section>
  );
}
