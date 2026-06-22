import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import ListingForm from "@/components/listings/ListingForm";

interface EditListingPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditListingPage({ params }: EditListingPageProps) {
  const user = await requireAuth();
  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      media: { select: { id: true, url: true, publicId: true, type: true } },
    },
  });

  if (!listing) {
    redirect("/dashboard/listings");
  }

  // Ownership check: owner or admin
  if (listing.ownerId !== user.id && user.role !== "ADMIN") {
    redirect("/dashboard/listings");
  }

  const initialData = {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    categoryId: listing.categoryId,
    country: listing.country,
    city: listing.city,
    address: listing.address,
    latitude: listing.latitude,
    longitude: listing.longitude,
    width: listing.width ?? undefined,
    height: listing.height ?? undefined,
    indoorOutdoor: listing.indoorOutdoor as "Indoor" | "Outdoor",
    digitalPhysical: listing.digitalPhysical as "Digital" | "Physical",
    price: listing.price,
    pricePeriod: listing.pricePeriod as "Hour" | "Day" | "Week" | "Month" | "Year",
    mediaUrls: listing.media.map((m) => ({ url: m.url, publicId: m.publicId ?? undefined, type: m.type })),
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Edit Listing</h2>
        <p className="mt-1 text-slate-500 text-sm">Update your advertising space details</p>
      </div>
      <ListingForm initialData={initialData} isEditing />
    </div>
  );
}
