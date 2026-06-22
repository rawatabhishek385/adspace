import { PrismaClient } from "@prisma/client";
import webpush from "web-push";

const prisma = new PrismaClient();

// Configure web-push with VAPID keys
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.EMAIL_FROM || "admin@adspace.com"}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function runSavedSearchAlertJob() {
  try {
    console.log("⏰ Running Saved Search Alert Job...");
    
    // Look for listings created in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const newListings = await prisma.listing.findMany({
      where: {
        createdAt: { gte: oneHourAgo },
        isActive: true
      },
      include: { category: true }
    });

    if (newListings.length === 0) {
      return;
    }

    const savedSearches = await prisma.savedSearch.findMany();

    for (const listing of newListings) {
      for (const search of savedSearches) {
        // Don't alert the owner of the listing
        if (search.userId === listing.ownerId) continue;

        let isMatch = true;

        if (search.categoryId && search.categoryId !== listing.categoryId) {
          isMatch = false;
        }

        if (isMatch && search.city && listing.city.toLowerCase() !== search.city.toLowerCase()) {
          isMatch = false;
        }

        if (isMatch && search.query) {
          const q = search.query.toLowerCase();
          if (!listing.title.toLowerCase().includes(q) && !listing.description.toLowerCase().includes(q)) {
            isMatch = false;
          }
        }

        if (isMatch) {
          // It's a match! Send notification
          await prisma.notification.create({
            data: {
              userId: search.userId,
              type: "SYSTEM",
              title: "New Matching Listing!",
              message: `A new ${listing.category.name} in ${listing.city} matches your saved search.`,
            }
          });

          // Attempt Push Notification
          const subs = await prisma.pushSubscription.findMany({ where: { userId: search.userId } });
          for (const sub of subs) {
            try {
              await webpush.sendNotification(
                {
                  endpoint: sub.endpoint,
                  keys: { p256dh: sub.p256dh, auth: sub.auth }
                },
                JSON.stringify({
                  title: "New Match Found!",
                  body: `A new listing "${listing.title}" matches your saved search.`,
                  url: `/listings/${listing.slug}`
                })
              );
            } catch (err: any) {
              if (err.statusCode === 410 || err.statusCode === 404) {
                // Subscription is dead
                await prisma.pushSubscription.delete({ where: { id: sub.id } });
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Error running Saved Search Alert Job:", error);
  } finally {
    await prisma.$disconnect();
  }
}
