import { prisma } from "../lib/prisma";
import { PrismaClient, ActivityType } from "@prisma/client";


export async function runRecommendationCleanup() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Delete user activities older than 30 days
    const deleted = await prisma.userActivity.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo },
      },
    });
    console.log(`✅ Recommendation Cleanup: Deleted ${deleted.count} old activity records.`);

    // 2. Recalculate recommendations for recently active users (e.g. active in the last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeUsers = await prisma.user.findMany({
      where: { lastSeen: { gte: sevenDaysAgo } },
      select: { id: true }
    });

    console.log(`🔄 Recalculating recommendations for ${activeUsers.length} users...`);

    for (const user of activeUsers) {
      await calculateRecommendationsForUser(user.id);
    }

    console.log(`✅ Recommendation Recalculation Complete.`);
  } catch (error) {
    console.error("Error running Recommendation Engine Job:", error);
  } finally {
    await prisma.$disconnect();
  }
}

async function calculateRecommendationsForUser(userId: string) {
  const activities = await prisma.userActivity.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Clear old recommendations
  await prisma.userRecommendation.deleteMany({
    where: { userId }
  });

  if (activities.length === 0) return;

  const weights: Record<ActivityType, number> = {
    SEARCH: 4,
    FAVORITE: 3,
    CHAT: 2,
    VIEW: 1,
  };

  const categoryScores: Record<string, number> = {};
  const cityScores: Record<string, number> = {};
  const viewedListings = new Set<string>();

  const now = Date.now();

  activities.forEach((activity) => {
    const ageDays = (now - activity.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    
    // Time decay logic: 
    // 0 days = 100% multiplier
    // 7 days = 80% multiplier
    // 30 days = 30% multiplier
    // 60 days = Ignore (handled by ageDays check)
    if (ageDays >= 60) return;

    let timeMultiplier = 1.0;
    if (ageDays <= 7) {
      timeMultiplier = 1.0 - (0.2 * (ageDays / 7)); // linearly decays from 1.0 to 0.8 over 7 days
    } else if (ageDays <= 30) {
      timeMultiplier = 0.8 - (0.5 * ((ageDays - 7) / 23)); // linearly decays from 0.8 to 0.3 over next 23 days
    } else {
      timeMultiplier = 0.3 * (1 - ((ageDays - 30) / 30)); // linearly decays from 0.3 to 0 over next 30 days
    }

    const baseWeight = weights[activity.actionType] || 1;
    const finalWeight = baseWeight * timeMultiplier;

    if (activity.categoryId) {
      categoryScores[activity.categoryId] = (categoryScores[activity.categoryId] || 0) + finalWeight;
    }
    if (activity.city) {
      cityScores[activity.city] = (cityScores[activity.city] || 0) + finalWeight * 0.5;
    }
    if (activity.listingId && activity.actionType === "VIEW") {
      viewedListings.add(activity.listingId);
    }
  });

  const topCategories = Object.entries(categoryScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => id);

  const topCities = Object.entries(cityScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([city]) => city);

  const candidates = await prisma.listing.findMany({
    where: {
      isActive: true,
      ownerId: { not: userId },
      id: { notIn: Array.from(viewedListings) },
      OR: [
        { categoryId: { in: topCategories } },
        { city: { in: topCities } },
      ],
    },
    take: 50,
  });

  const scoredRecommendations = candidates.map((listing) => {
    let score = 0;
    if (topCategories.includes(listing.categoryId)) {
      score += categoryScores[listing.categoryId] || 0;
    }
    if (topCities.includes(listing.city)) {
      score += cityScores[listing.city] || 0;
    }
    return { listingId: listing.id, score };
  });

  scoredRecommendations.sort((a, b) => b.score - a.score);
  const top10 = scoredRecommendations.slice(0, 10);

  if (top10.length > 0) {
    await prisma.userRecommendation.createMany({
      data: top10.map((r) => ({
        userId,
        listingId: r.listingId,
        score: r.score,
      })),
    });
  }
}
