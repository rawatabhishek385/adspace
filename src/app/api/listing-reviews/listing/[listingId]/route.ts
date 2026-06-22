import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const { listingId } = await params;

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        averageRating: true,
        totalRatings: true,
      },
    });

    if (!listing) {
      return NextResponse.json({ success: false, message: "Listing not found" }, { status: 404 });
    }

    const reviews = await prisma.listingReview.findMany({
      where: { listingId, isDeleted: false },
      include: {
        reviewer: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        averageRating: listing.averageRating,
        totalRatings: listing.totalRatings,
        reviews,
      },
    });
  } catch (error) {
    console.error("Error fetching listing reviews:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
