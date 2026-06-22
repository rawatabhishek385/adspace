import { prisma } from "@/lib/prisma";
import { ListingReviewTable } from "./ListingReviewTable";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { redirect } from "next/navigation";

export default async function AdminListingReviewsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const reviews = await prisma.listingReview.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      reviewer: { select: { id: true, name: true, avatar: true } },
      listing: { select: { id: true, title: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Listing Reviews</h2>
          <p className="mt-1 text-slate-400 text-sm">
            Monitor and moderate all listing reviews on the platform
          </p>
        </div>
      </div>

      <ListingReviewTable initialReviews={reviews.map(r => ({ ...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() }))} />
    </div>
  );
}
