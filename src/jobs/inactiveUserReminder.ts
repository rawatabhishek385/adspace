import { PrismaClient } from "@prisma/client";

// Since this might run in a separate process, we instantiate a new PrismaClient
const prisma = new PrismaClient();

export async function runInactiveUserReminder() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find users who:
    // 1. Have not been updated in 30 days (updatedAt acts as a rough proxy for activity if we update it on login/profile save)
    // 2. We can also check if they have 0 user activities in the last 30 days
    const users = await prisma.user.findMany({
      where: {
        userActivities: {
          none: {
            createdAt: { gte: thirtyDaysAgo },
          },
        },
        // Only target users created more than 30 days ago to give them a chance
        createdAt: { lt: thirtyDaysAgo },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (users.length === 0) {
      console.log("No inactive users found.");
      return;
    }

    // In a real app, you would send an email here using Resend or NodeMailer.
    // We will just log it for now as an automated system event.
    console.log(`Found ${users.length} inactive users. Sending reminder emails...`);

    for (const user of users) {
      // e.g. await sendEmail({ to: user.email, subject: "We miss you!" ... })
      console.log(`[EMAIL SIMULATION] Sent 'We miss you' email to ${user.email} (${user.name})`);
    }

    console.log("✅ Inactive User Reminder Job Completed.");
  } catch (error) {
    console.error("Error running Inactive User Reminder Job:", error);
  } finally {
    await prisma.$disconnect();
  }
}
