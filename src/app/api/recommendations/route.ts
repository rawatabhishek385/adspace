import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { getUserCountry } from "@/lib/getUserCountry";
import type { ActivityType } from "@prisma/client";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch cached recommendations for the user
    const cachedRecommendations = await prisma.userRecommendation.findMany({
      where: { userId },
      orderBy: { score: "desc" },
      take: 10,
      include: {
        listing: {
          include: {
            category: true,
            media: true,
            _count: {
              select: { favorites: true, listingReviews: true },
            },
          },
        },
      },
    });

    if (cachedRecommendations.length > 0) {
      const recommendations = cachedRecommendations.map((r) => r.listing);
      return NextResponse.json({ success: true, data: recommendations, isFallback: false });
    }

    // Fallback: Return trending/popular listings filtered by user's country
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { country: true, role: true } });
    const isAdmin = user?.role === "ADMIN";
    const fallbackWhere: Record<string, unknown> = { isActive: true };
    if (user?.country && !isAdmin) {
      fallbackWhere.country = { contains: user.country };
    }

    const popular = await prisma.listing.findMany({
      where: fallbackWhere,
      orderBy: { viewCount: "desc" },
      take: 10,
      include: {
        category: true,
        media: true,
        _count: {
          select: { favorites: true, listingReviews: true },
        },
      },
    });
    return NextResponse.json({ success: true, data: popular, isFallback: true });

  } catch (error) {
    console.error("Recommendations error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}
