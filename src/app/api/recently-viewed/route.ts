import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, data: [] });
    }

    const recentlyViewed = await prisma.recentlyViewed.findMany({
      where: { userId: session.user.id },
      orderBy: { viewedAt: 'desc' },
      take: 10,
      include: {
        listing: {
          include: {
            category: { select: { id: true, name: true } },
            media: { select: { id: true, url: true, publicId: true, type: true } },
            owner: { select: { id: true, name: true } },
            _count: { select: { favorites: true } }
          }
        }
      }
    });

    // Extract the listing objects from the wrappers
    const listings = recentlyViewed.map(item => item.listing);
    
    // Deduplicate in case of race conditions during creation
    const uniqueListings = Array.from(new Map(listings.map(item => [item.id, item])).values());

    return NextResponse.json({ success: true, data: uniqueListings });
  } catch (error) {
    console.error("Recently viewed error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch recently viewed" },
      { status: 500 }
    );
  }
}
