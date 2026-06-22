import { prisma } from "../lib/prisma";


export async function runWeeklyEmailJob() {
  try {
    // 1. Fetch active users (e.g. users active in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUsers = await prisma.user.findMany({
      where: {
        lastSeen: { gte: thirtyDaysAgo },
      },
      select: {
        id: true,
        email: true,
        name: true,
        preferredCity: true,
      },
    });

    if (activeUsers.length === 0) {
      console.log("No active users to send weekly emails to.");
      return;
    }

    // 2. Fetch global trending listings as fallback
    const trendingListings = await prisma.listing.findMany({
      where: { isActive: true },
      orderBy: { trendingScore: "desc" },
      take: 5,
      select: { id: true, title: true, city: true },
    });

    let emailsSent = 0;

    for (const user of activeUsers) {
      // Fetch personalized recommendations
      const recommendations = await prisma.userRecommendation.findMany({
        where: { userId: user.id },
        orderBy: { score: "desc" },
        take: 3,
        include: {
          listing: { select: { title: true, city: true } },
        },
      });

      // Mix recommendations with trending
      let emailBody = `Hi ${user.name},\n\nHere are your top advertising spaces this week:\n\n`;

      if (recommendations.length > 0) {
        emailBody += `✨ Recommended for you:\n`;
        recommendations.forEach((r) => {
          emailBody += `✓ ${r.listing.title} (${r.listing.city})\n`;
        });
        emailBody += `\n`;
      }

      emailBody += `🔥 Trending right now:\n`;
      trendingListings.slice(0, 3).forEach((t) => {
        emailBody += `✓ ${t.title} (${t.city})\n`;
      });

      console.log(`[EMAIL SIMULATION] Sent Weekly Update to ${user.email}:\n${emailBody}`);
      emailsSent++;
    }

    console.log(`✅ Weekly Email Job Completed. Sent ${emailsSent} emails.`);
  } catch (error) {
    console.error("Error running Weekly Email Job:", error);
  } finally {
    await prisma.$disconnect();
  }
}
