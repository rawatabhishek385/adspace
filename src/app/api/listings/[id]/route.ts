import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { deleteMultipleFromCloudinary, deleteFromCloudinary } from "@/lib/cloudinary.helpers";
import { generateUniqueSlug } from "@/lib/slug";

const includeRelations = {
  owner: { select: { id: true, name: true, email: true, phone: true } },
  category: { select: { id: true, name: true } },
  media: { select: { id: true, url: true, publicId: true, type: true } },
};

// ─── GET /api/listings/[id] — Get single listing by id OR slug (public) ─────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Try finding by slug first, then by id
    const listing = await prisma.listing.findFirst({
      where: {
        OR: [{ slug: id }, { id }],
      },
      include: includeRelations,
    });

    if (!listing) {
      return NextResponse.json(
        { success: false, message: "Listing not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: listing });
  } catch (error) {
    console.error("Error fetching listing:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch listing" },
      { status: 500 }
    );
  }
}

// ─── PATCH /api/listings/[id] — Update listing (owner or admin) ─────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.listing.findUnique({
      where: { id },
      include: { media: { select: { id: true, publicId: true, type: true } } },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: "Listing not found" }, { status: 404 });
    }

    // Ownership check: owner or admin
    if (existing.ownerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Not authorized" }, { status: 403 });
    }

    const body = await request.json();

    // Build update data — only include fields that are provided
    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) {
      updateData.title = body.title.trim();
      // Regenerate slug when title changes
      updateData.slug = await generateUniqueSlug(body.title);
    }
    if (body.description !== undefined) updateData.description = body.description.trim();
    if (body.country !== undefined) updateData.country = body.country.trim();
    if (body.city !== undefined) updateData.city = body.city.trim();
    if (body.address !== undefined) updateData.address = body.address.trim();
    if (body.latitude !== undefined) updateData.latitude = body.latitude;
    if (body.longitude !== undefined) updateData.longitude = body.longitude;
    if (body.width !== undefined) updateData.width = body.width;
    if (body.height !== undefined) updateData.height = body.height;
    if (body.indoorOutdoor !== undefined) updateData.indoorOutdoor = body.indoorOutdoor;
    if (body.digitalPhysical !== undefined) updateData.digitalPhysical = body.digitalPhysical;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.pricePeriod !== undefined) updateData.pricePeriod = body.pricePeriod;
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    // Admin can toggle isActive and isFeatured
    if (body.isActive !== undefined && session.user.role === "ADMIN") {
      updateData.isActive = body.isActive;
    }
    if (body.isFeatured !== undefined && session.user.role === "ADMIN") {
      updateData.isFeatured = body.isFeatured;
    }

    // Handle media update — delete old Cloudinary assets, then replace
    if (body.mediaUrls !== undefined) {
      if (body.mediaUrls.length > 5) {
        return NextResponse.json({ success: false, message: "A maximum of 5 media files is allowed" }, { status: 400 });
      }

      // Delete old assets from Cloudinary
      const oldMedia = existing.media.map((m) => ({
        publicId: m.publicId,
        type: m.type,
      }));
      await deleteMultipleFromCloudinary(oldMedia);

      // Delete old DB records
      await prisma.media.deleteMany({ where: { listingId: id } });

      // Create new media records
      if (body.mediaUrls.length > 0) {
        await prisma.media.createMany({
          data: body.mediaUrls.map((m: { url: string; publicId?: string; type: string }) => ({
            url: m.url,
            publicId: m.publicId || null,
            type: m.type as "IMAGE" | "VIDEO",
            listingId: id,
          })),
        });
      }
    }

    const listing = await prisma.listing.update({
      where: { id },
      data: updateData,
      include: includeRelations,
    });

    return NextResponse.json({ success: true, message: "Listing updated", data: listing });
  } catch (error) {
    console.error("Error updating listing:", error);
    return NextResponse.json({ success: false, message: "Failed to update listing" }, { status: 500 });
  }
}

// ─── DELETE /api/listings/[id] — Delete listing + cleanup Cloudinary ────────

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.listing.findUnique({
      where: { id },
      include: { media: { select: { id: true, publicId: true, type: true } } },
    });

    if (!existing) {
      return NextResponse.json({ success: false, message: "Listing not found" }, { status: 404 });
    }

    // Ownership check
    if (existing.ownerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Not authorized" }, { status: 403 });
    }

    // 1. Delete Cloudinary assets
    const mediaToDelete = existing.media.map((m) => ({
      publicId: m.publicId,
      type: m.type,
    }));
    await deleteMultipleFromCloudinary(mediaToDelete);

    // 2. Delete media records
    await prisma.media.deleteMany({ where: { listingId: id } });

    // 3. Delete listing
    await prisma.listing.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Listing deleted" });
  } catch (error) {
    console.error("Error deleting listing:", error);
    return NextResponse.json({ success: false, message: "Failed to delete listing" }, { status: 500 });
  }
}
