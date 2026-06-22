import { PrismaClient, NotificationType, CampaignStatus } from "@prisma/client";
import webpush from "web-push";

const prisma = new PrismaClient();

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.EMAIL_FROM || "admin@adspace.com"}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function runCampaignJob() {
  try {
    const pendingCampaigns = await prisma.notificationCampaign.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { lte: new Date() },
      },
    });

    // Also process any DRAFTs that were set to INSTANT but not yet sent
    const instantCampaigns = await prisma.notificationCampaign.findMany({
      where: {
        status: "DRAFT",
        sendType: "INSTANT",
      },
    });

    const campaignsToProcess = [...pendingCampaigns, ...instantCampaigns];

    if (campaignsToProcess.length === 0) {
      return;
    }

    console.log(`📣 Processing ${campaignsToProcess.length} notification campaigns...`);

    for (const campaign of campaignsToProcess) {
      // Find target users based on audience
      let userQuery: any = { isActive: true };

      if (campaign.targetAudience === "BUYERS") {
        userQuery.buyerConversations = { some: {} };
      } else if (campaign.targetAudience === "OWNERS") {
        userQuery.listings = { some: {} };
      } else if (campaign.targetAudience === "PREMIUM_USERS") {
        // Assume all users for now if no premium flag
      }

      const targetUsers = await prisma.user.findMany({
        where: userQuery,
        select: { id: true },
      });

      console.log(`   -> Campaign "${campaign.title}" targets ${targetUsers.length} users.`);

      // Create notifications in chunks
      const chunkSize = 500;
      for (let i = 0; i < targetUsers.length; i += chunkSize) {
        const chunk = targetUsers.slice(i, i + chunkSize);
        await prisma.notification.createMany({
          data: chunk.map(user => ({
            userId: user.id,
            title: campaign.title,
            message: campaign.message,
            imageUrl: campaign.imageUrl,
            actionUrl: campaign.actionUrl,
            type: "ADMIN" as NotificationType,
          })),
          skipDuplicates: true,
        });

        // Push Notifications
        const chunkIds = chunk.map(u => u.id);
        const subs = await prisma.pushSubscription.findMany({ where: { userId: { in: chunkIds } } });
        
        for (const sub of subs) {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              JSON.stringify({
                title: campaign.title,
                message: campaign.message,
                imageUrl: campaign.imageUrl,
                actionUrl: campaign.actionUrl,
              })
            );
          } catch (err: any) {
            if (err.statusCode === 410 || err.statusCode === 404) {
              await prisma.pushSubscription.delete({ where: { id: sub.id } });
            }
          }
        }
      }

      // Mark campaign as sent
      await prisma.notificationCampaign.update({
        where: { id: campaign.id },
        data: {
          status: "SENT",
          sentAt: new Date(),
        },
      });
    }

    console.log(`✅ Campaign Job Completed.`);
  } catch (error) {
    console.error("Error running Campaign Job:", error);
  } finally {
    await prisma.$disconnect();
  }
}
