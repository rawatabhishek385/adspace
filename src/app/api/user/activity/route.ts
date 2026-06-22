import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const activities = await prisma.userActivity.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const listingIds = activities.filter(a => a.listingId).map(a => a.listingId as string);
    const categoryIds = activities.filter(a => a.categoryId).map(a => a.categoryId as string);

    const [listings, categories] = await Promise.all([
      listingIds.length > 0 ? prisma.listing.findMany({
        where: { id: { in: listingIds } },
        select: { id: true, slug: true, title: true }
      }) : [],
      categoryIds.length > 0 ? prisma.category.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true }
      }) : []
    ]);

    const listingsMap = new Map(listings.map(l => [l.id, l]));
    const categoriesMap = new Map(categories.map(c => [c.id, c]));

    const enrichedActivities = activities.map(activity => ({
      ...activity,
      listing: activity.listingId ? listingsMap.get(activity.listingId) : undefined,
      category: activity.categoryId ? categoriesMap.get(activity.categoryId) : undefined,
    }));

    return NextResponse.json({ success: true, data: enrichedActivities });
  } catch (error) {
    console.error("Activity fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}
