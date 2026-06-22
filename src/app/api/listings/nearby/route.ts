import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { haversineDistance, formatDistance } from "@/lib/geo";

const includeRelations = {
  owner: { select: { id: true, name: true, email: true, phone: true } },
  category: { select: { id: true, name: true } },
  media: { select: { id: true, url: true, publicId: true, type: true } },
  _count: { select: { favorites: true } },
};

// ─── GET /api/listings/nearby — Nearby listings with Haversine distance ──────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const lat = parseFloat(searchParams.get("lat") || "");
    const lng = parseFloat(searchParams.get("lng") || "");
    const radius = parseFloat(searchParams.get("radius") || "25");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const categoryId = searchParams.get("categoryId");
    const sort = searchParams.get("sort") || "nearest"; // nearest | trending

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { success: false, message: "Valid latitude and longitude are required" },
        { status: 400 }
      );
    }

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { isActive: true };
    if (categoryId) where.categoryId = categoryId;

    // Rough bounding box filter to reduce computation
    // 1 degree latitude ≈ 111 km
    const latDelta = radius / 111;
    const lngDelta = radius / (111 * Math.cos(toRadians(lat)));

    where.latitude = { gte: lat - latDelta, lte: lat + latDelta };
    where.longitude = { gte: lng - lngDelta, lte: lng + lngDelta };

    const listings = await prisma.listing.findMany({
      where,
      include: includeRelations,
    });

    // Compute exact Haversine distance and filter
    const withDistance = listings
      .map((listing) => {
        const distance = haversineDistance(lat, lng, listing.latitude, listing.longitude);
        return {
          ...listing,
          distance: Math.round(distance * 10) / 10,
          distanceText: formatDistance(distance),
        };
      })
      .filter((l) => l.distance <= radius);

    // Sort
    if (sort === "trending") {
      withDistance.sort((a, b) => b.viewCount - a.viewCount);
    } else {
      // Default: nearest first
      withDistance.sort((a, b) => a.distance - b.distance);
    }

    // Paginate
    const total = withDistance.length;
    const paginated = withDistance.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      success: true,
      data: paginated,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching nearby listings:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch nearby listings" },
      { status: 500 }
    );
  }
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
