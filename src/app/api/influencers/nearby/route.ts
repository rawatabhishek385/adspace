import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get("city") || "";
    const country = searchParams.get("country") || "";
    const limit = parseInt(searchParams.get("limit") || "12", 10);

    if (!city && !country) {
      return NextResponse.json({ success: true, data: [] });
    }

    const whereClause: any = {
      status: "APPROVED",
      isPublic: true,
      OR: [],
    };

    if (city) {
      whereClause.OR.push(
        { city: { contains: city } },
        { user: { city: { contains: city } } }
      );
    }
    
    if (country) {
      whereClause.OR.push(
        { user: { country: { contains: country } } }
      );
    }

    if (whereClause.OR.length === 0) {
      delete whereClause.OR;
    }

    const influencers = await prisma.influencerProfile.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true, avatar: true } },
      },
      take: limit,
      orderBy: { followers: "desc" },
    });

    return NextResponse.json({ success: true, data: influencers });
  } catch (error) {
    console.error("Error fetching nearby influencers:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch influencers" },
      { status: 500 }
    );
  }
}
