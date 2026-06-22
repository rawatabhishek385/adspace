import { prisma } from "../lib/prisma";


export async function runReviewReminder() {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Find conversations where:
    // 1. Last message was exactly between 3 and 7 days ago
    // 2. No review has been left
    const conversations = await prisma.conversation.findMany({
      where: {
        lastMessageAt: {
          lte: threeDaysAgo,
          gte: sevenDaysAgo,
        },
      },
      include: {
        buyer: { select: { id: true, email: true, name: true, reviewReminderSentAt: true } },
        owner: { select: { id: true, email: true, name: true, reviewReminderSentAt: true } },
        listing: { select: { title: true } },
        reviews: true,
      },
    });

    if (conversations.length === 0) {
      console.log("No pending reviews found for reminders.");
      return;
    }

    let remindersSent = 0;

    for (const conv of conversations) {
      if (!conv.listing) continue;

      // Check if buyer reviewed
      const buyerReviewed = conv.reviews.some((r) => r.reviewerId === conv.buyerId);
      // Check if owner reviewed
      const ownerReviewed = conv.reviews.some((r) => r.reviewerId === conv.ownerId);

      const canSendTo = (user: { reviewReminderSentAt?: Date | null }) => {
        if (!user.reviewReminderSentAt) return true;
        const diffDays = (new Date().getTime() - user.reviewReminderSentAt.getTime()) / (1000 * 3600 * 24);
        return diffDays > 7;
      };

      if (!buyerReviewed && conv.buyer.email && canSendTo(conv.buyer)) {
        console.log(`[EMAIL SIMULATION] Sent Review Reminder to Buyer: ${conv.buyer.email} for listing ${conv.listing.title}`);
        await prisma.user.update({
          where: { id: conv.buyer.id },
          data: { reviewReminderSentAt: new Date() },
        });

        await prisma.notification.create({
          data: {
            userId: conv.buyer.id,
            title: "⭐ How was your experience?",
            message: `Time to ask for review! Please leave a review for "${conv.listing.title}".`,
            type: "REVIEW",
            actionUrl: `/dashboard/reviews`,
          }
        });

        remindersSent++;
      }

      if (!ownerReviewed && conv.owner.email && canSendTo(conv.owner)) {
        console.log(`[EMAIL SIMULATION] Sent Review Reminder to Owner: ${conv.owner.email} for listing ${conv.listing.title}`);
        await prisma.user.update({
          where: { id: conv.owner.id },
          data: { reviewReminderSentAt: new Date() },
        });

        await prisma.notification.create({
          data: {
            userId: conv.owner.id,
            title: "⭐ How was your experience?",
            message: `Time to ask for review! Please leave a review for the user regarding "${conv.listing.title}".`,
            type: "REVIEW",
            actionUrl: `/dashboard/reviews`,
          }
        });

        remindersSent++;
      }
    }

    console.log(`✅ Review Reminder Job Completed. Sent ${remindersSent} reminders.`);
  } catch (error) {
    console.error("Error running Review Reminder Job:", error);
  } finally {
    await prisma.$disconnect();
  }
}
