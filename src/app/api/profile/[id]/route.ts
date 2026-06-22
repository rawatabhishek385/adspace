import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        avatar: true,
        bio: true,
        city: true,
        country: true,
        website: true,
        createdAt: true,
        averageRating: true,
        totalReviews: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const listings = await prisma.listing.findMany({
      where: { ownerId: id, isActive: true },
      include: {
        category: { select: { id: true, name: true } },
        media: { select: { id: true, url: true, type: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalListings = await prisma.listing.count({ where: { ownerId: id } });
    const activeListings = listings.length;
    const featuredListings = await prisma.listing.count({ where: { ownerId: id, isFeatured: true } });
    
    // Sum of all listing views
    const viewsAggregation = await prisma.listing.aggregate({
      where: { ownerId: id },
      _sum: { viewCount: true },
    });
    const totalViews = viewsAggregation._sum.viewCount || 0;

    const stats = {
      totalListings,
      activeListings,
      featuredListings,
      totalViews,
    };

    return NextResponse.json({
      success: true,
      data: { user, stats, listings },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
