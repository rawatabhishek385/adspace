import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json({ error: "Listing ID is required" }, { status: 400 });
    }

    // Increment the view count safely using atomic update
    const updatedListing = await prisma.listing.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
      select: {
        id: true,
        viewCount: true,
        categoryId: true,
        city: true,
      },
    });

    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      // Find recent activity to prevent spamming
      const recentActivity = await prisma.userActivity.findFirst({
        where: {
          userId: session.user.id,
          actionType: "VIEW",
          listingId: id,
          createdAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000), // 5 mins
          },
        },
      });

      if (!recentActivity) {
        await prisma.userActivity.create({
          data: {
            userId: session.user.id,
            actionType: "VIEW",
            listingId: id,
            categoryId: updatedListing.categoryId,
            city: updatedListing.city,
          },
        });
      }

      // Track in RecentlyViewed model for UI
      const existingView = await prisma.recentlyViewed.findFirst({
        where: { userId: session.user.id, listingId: id }
      });
      
      if (existingView) {
        await prisma.recentlyViewed.update({
          where: { id: existingView.id },
          data: { viewedAt: new Date() }
        });
      } else {
        await prisma.recentlyViewed.create({
          data: {
            userId: session.user.id,
            listingId: id
          }
        });
      }
    }

    return NextResponse.json(updatedListing);
  } catch (error: unknown) {
    // If the listing doesn't exist, prisma throws a P2025 error.
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
        return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    
    console.error("Failed to increment view count:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
