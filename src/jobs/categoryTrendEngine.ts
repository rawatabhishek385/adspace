import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function runCategoryTrendEngine() {
  try {
    console.log("📈 Running Category Trend Engine...");

    // Find all views in the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentActivity = await prisma.userActivity.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        categoryId: { not: null }
      }
    });

    const categoryScores: Record<string, number> = {};
    for (const activity of recentActivity) {
      if (activity.categoryId) {
        categoryScores[activity.categoryId] = (categoryScores[activity.categoryId] || 0) + 1;
      }
    }

    // Now update category trend scores
    // We don't have a trendScore on Category model in schema, so let's log the top 5
    // If we wanted to use this in UI, we would add a field to Category model and update it
    const sortedCategories = Object.entries(categoryScores).sort((a, b) => b[1] - a[1]);
    
    console.log("Top Trending Categories:", sortedCategories.slice(0, 5));

    console.log("✅ Category Trend Engine Completed.");
  } catch (error) {
    console.error("Error running Category Trend Engine:", error);
  } finally {
    await prisma.$disconnect();
  }
}
