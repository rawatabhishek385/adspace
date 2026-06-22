import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 1. Get current listing to base similarities on
    const currentListing = await prisma.listing.findUnique({
      where: { id },
      include: { category: true }
    });

    if (!currentListing) {
      return NextResponse.json({ success: false, error: "Listing not found" }, { status: 404 });
    }

    // 2. Find similar listings based on category, city, and price
    const similarListings = await prisma.listing.findMany({
      where: {
        id: { not: id }, // Exclude current
        isActive: true,
        OR: [
          { categoryId: currentListing.categoryId },
          { city: currentListing.city }
        ]
      },
      include: {
        category: { select: { id: true, name: true } },
        media: { select: { id: true, url: true, publicId: true, type: true } },
        _count: { select: { favorites: true } },
        owner: { select: { id: true, name: true } }
      },
      take: 20 // Fetch more than we need, so we can sort them manually
    });

    // 3. Score and sort manually to ensure best matches
    const scoredListings = similarListings.map(listing => {
      let score = 0;
      
      // Category match is highly relevant
      if (listing.categoryId === currentListing.categoryId) score += 5;
      
      // City match
      if (listing.city === currentListing.city) score += 3;
      
      // Price proximity (within 30%)
      const priceDiffRatio = Math.abs(listing.price - currentListing.price) / currentListing.price;
      if (priceDiffRatio <= 0.3) score += 2;
      
      // Type matches
      if (listing.indoorOutdoor === currentListing.indoorOutdoor) score += 1;
      if (listing.digitalPhysical === currentListing.digitalPhysical) score += 1;
      
      return { listing, score };
    });

    // Sort by score (descending) and return top 6
    const top6 = scoredListings
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(item => item.listing);

    return NextResponse.json({ success: true, data: top6 });
  } catch (error) {
    console.error("Similar listings error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch similar listings" },
      { status: 500 }
    );
  }
}
