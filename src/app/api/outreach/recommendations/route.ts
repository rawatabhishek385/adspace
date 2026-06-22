import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const city = searchParams.get("city");
    const limit = parseInt(searchParams.get("limit") || "4");

    // Build query to find recommended creators
    // We boost creators who are:
    // 1. Available
    // 2. High Rating
    // 3. Matching category/city
    const whereClause: any = {
      isPublic: true,
      status: "APPROVED",
      userId: { not: session.user.id } // Don't recommend themselves
    };

    if (category) {
      whereClause.category = category;
    }
    if (city) {
      whereClause.city = city;
    }

    // First try strict match
    let creators = await prisma.influencerProfile.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, avatar: true }
        }
      },
      orderBy: [
        { rating: 'desc' },
        { totalCampaigns: 'desc' },
        { profileViews: 'desc' } // Tie breaker
      ],
      take: limit,
    });

    // If we didn't find enough, backfill with top rated creators generally
    if (creators.length < limit) {
      const existingIds = creators.map(c => c.id);
      const backfill = await prisma.influencerProfile.findMany({
        where: {
          isPublic: true,
          status: "APPROVED",
          userId: { not: session.user.id },
          id: { notIn: existingIds }
        },
        include: {
          user: {
            select: { id: true, name: true, avatar: true }
          }
        },
        orderBy: [
          { rating: 'desc' },
          { totalCampaigns: 'desc' }
        ],
        take: limit - creators.length,
      });

      creators = [...creators, ...backfill];
    }

    const recommendations = creators.map(c => ({
      id: c.id,
      name: c.user.name,
      avatar: c.profileImage || c.user.avatar,
      category: c.category,
      city: c.city,
      followers: c.followers,
      rating: c.rating,
      totalCampaigns: c.totalCampaigns,
      availabilityStatus: c.availabilityStatus,
      responseTime: c.responseTime,
    }));

    return NextResponse.json({ recommendations });
  } catch (error: any) {
    console.error("Error fetching recommendations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
