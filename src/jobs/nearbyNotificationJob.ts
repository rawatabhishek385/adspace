import { prisma } from "../lib/prisma";
import { NotificationType } from "@prisma/client";



export async function runNearbyNotificationJob() {
  try {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    // 1. Find listings created in the last hour
    const newListings = await prisma.listing.findMany({
      where: {
        createdAt: { gte: oneHourAgo },
        isActive: true,
      },
      include: {
        category: true,
      },
    });

    if (newListings.length === 0) {
      console.log("No new listings to notify about.");
      return;
    }

    // 2. Fetch all users who have preferredCity set and want notifications
    // Ideally, we only fetch users whose preferredCity matches one of the new listings' cities to save memory
    const citiesWithNewListings = [...new Set(newListings.map((l) => l.city))];
    
    const interestedUsers = await prisma.user.findMany({
      where: {
        preferredCity: { in: citiesWithNewListings },
      },
      select: {
        id: true,
        email: true,
        name: true,
        preferredCity: true,
        notificationRadius: true,
      },
    });

    if (interestedUsers.length === 0) {
      console.log("No interested users found for new listings' cities.");
      return;
    }

    let notificationsCreated = 0;

    for (const listing of newListings) {
      // Find users matching this listing's city
      const matchedUsers = interestedUsers.filter((u) => u.preferredCity === listing.city);

      for (const user of matchedUsers) {
        // Prevent notifying the owner
        if (user.id === listing.ownerId) continue;

        // Since we don't have the user's exact lat/lng stored easily (just preferredCity), 
        // matching the city name is a sufficient trigger for Phase B.
        // If we stored user's home lat/lng, we could use calculateDistance(lat1, lon1, lat2, lon2) <= user.notificationRadius
        
        await prisma.notification.create({
          data: {
            userId: user.id,
            title: `New ${listing.category.name} in ${listing.city}`,
            message: `${listing.title} was just added near you. Check it out!`,
            type: NotificationType.NEARBY_LISTING,
          },
        });

        console.log(`[EMAIL SIMULATION] Sent Nearby Notification to ${user.email} for ${listing.title}`);
        notificationsCreated++;
      }
    }

    console.log(`✅ Nearby Notification Job Completed. Created ${notificationsCreated} notifications.`);
  } catch (error) {
    console.error("Error running Nearby Notification Job:", error);
  } finally {
    await prisma.$disconnect();
  }
}
