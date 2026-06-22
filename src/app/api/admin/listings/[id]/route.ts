import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { deleteFromCloudinary } from "@/lib/cloudinary.helpers";

interface Params { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { isActive, isFeatured } = body;

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) {
    return NextResponse.json({ success: false, message: "Listing not found" }, { status: 404 });
  }

  const updateData: { isActive?: boolean; isFeatured?: boolean } = {};
  if (isActive !== undefined) updateData.isActive = isActive;
  if (isFeatured !== undefined) updateData.isFeatured = isFeatured;

  const updated = await prisma.listing.update({
    where: { id },
    data: updateData,
    select: { id: true, title: true, isActive: true, isFeatured: true },
  });

  // Log activity
  let action = "LISTING_UPDATED";
  if (isActive === false) action = "LISTING_DISABLED";
  else if (isActive === true) action = "LISTING_ENABLED";
  else if (isFeatured === true) action = "LISTING_FEATURED";
  else if (isFeatured === false) action = "LISTING_UNFEATURED";

  await prisma.activityLog.create({
    data: {
      action,
      details: `Listing: ${listing.title}`,
      actorId: session.user.id,
      targetId: id,
    },
  });

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { media: true },
  });

  if (!listing) {
    return NextResponse.json({ success: false, message: "Listing not found" }, { status: 404 });
  }

  // Delete Cloudinary assets
  for (const m of listing.media) {
    if (m.publicId) {
      await deleteFromCloudinary(m.publicId, m.type);
    }
  }

  // Delete related DB records
  await prisma.media.deleteMany({ where: { listingId: id } });
  await prisma.report.deleteMany({ where: { listingId: id } });
  await prisma.listing.delete({ where: { id } });

  await prisma.activityLog.create({
    data: {
      action: "LISTING_DELETED",
      details: `Listing: ${listing.title}`,
      actorId: session.user.id,
      targetId: id,
    },
  });

  return NextResponse.json({ success: true, message: "Listing deleted" });
}
