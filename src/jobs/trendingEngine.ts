import { prisma } from "../lib/prisma";


export async function runTrendingEngine() {
  try {
    // We update the trending score for all active listings.
    // In a massive DB, we would chunk this or only update listings active in the last 7 days.
    const activeListings = await prisma.listing.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            favorites: true,
            conversations: true,
            listingReviews: true,
          },
        },
      },
    });

    console.log(`🔥 Calculating trending scores for ${activeListings.length} listings...`);

    for (const listing of activeListings) {
      // Trending Score = Views * 0.4 + Favorites * 0.3 + Chats * 0.2 + Reviews * 0.1
      // We will use total ratings count since listingReviews is accurate
      const score = 
        (listing.viewCount * 0.4) + 
        (listing._count.favorites * 0.3) + 
        (listing._count.conversations * 0.2) + 
        (listing._count.listingReviews * 0.1);

      await prisma.listing.update({
        where: { id: listing.id },
        data: { trendingScore: score },
      });

      // Smart Alert: If the score crosses a certain threshold and is high enough,
      // notify the owner!
      if (score > 50) {
        // Find existing notification to avoid spamming
        const existingAlert = await prisma.notification.findFirst({
          where: {
            userId: listing.ownerId,
            type: "ALERT",
            title: { contains: "trending" },
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // 1 per week
          }
        });

        if (!existingAlert) {
          await prisma.notification.create({
            data: {
              userId: listing.ownerId,
              title: "🔥 Your listing is trending!",
              message: `Your listing "${listing.title}" is getting a lot of attention right now.`,
              type: "ALERT",
              actionUrl: `/listings/${listing.id}`,
            }
          });
        }
      }
    }

    console.log(`✅ Trending Engine Job Completed.`);
  } catch (error) {
    console.error("Error running Trending Engine Job:", error);
  } finally {
    await prisma.$disconnect();
  }
}
