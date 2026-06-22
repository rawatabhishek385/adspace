import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // We must manually delete all dependent records because Prisma schema
    // does not have onDelete: Cascade for everything in this MySQL database.
    await prisma.$transaction(async (tx) => {
      // 1. Delete user favorites
      await tx.favorite.deleteMany({ where: { userId } });
      
      // 2. Delete user's given and received reviews
      await tx.review.deleteMany({ where: { OR: [{ reviewerId: userId }, { revieweeId: userId }] } });
      await tx.listingReview.deleteMany({ where: { reviewerId: userId } });
      
      // 3. Delete user reports
      await tx.userReport.deleteMany({ where: { OR: [{ reporterId: userId }, { reportedUserId: userId }] } });
      await tx.report.deleteMany({ where: { reporterId: userId } });

      // 4. Delete user's messages
      await tx.message.deleteMany({ where: { senderId: userId } });

      // 5. Delete user's conversations
      await tx.conversation.deleteMany({ where: { OR: [{ buyerId: userId }, { ownerId: userId }] } });

      // 6. Delete media, messages, favorites, reports, reviews for user's listings
      const userListings = await tx.listing.findMany({ where: { ownerId: userId }, select: { id: true } });
      const listingIds = userListings.map(l => l.id);
      
      if (listingIds.length > 0) {
        await tx.media.deleteMany({ where: { listingId: { in: listingIds } } });
        await tx.report.deleteMany({ where: { listingId: { in: listingIds } } });
        await tx.listingReview.deleteMany({ where: { listingId: { in: listingIds } } });
        await tx.favorite.deleteMany({ where: { listingId: { in: listingIds } } });
        await tx.message.deleteMany({ where: { conversation: { listingId: { in: listingIds } } } });
        await tx.conversation.deleteMany({ where: { listingId: { in: listingIds } } });
        
        // Finally, delete the actual listings
        await tx.listing.deleteMany({ where: { ownerId: userId } });
      }

      // 7. Delete activity logs (if any)
      await tx.activityLog.deleteMany({ where: { actorId: userId } });

      // 8. Delete the user
      await tx.user.delete({ where: { id: userId } });
    }, {
      maxWait: 10000, // 10s wait
      timeout: 30000, // 30s timeout
    });

    // Notify admins
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    if (admins.length > 0) {
      const notificationsData = admins.map(admin => ({
        userId: admin.id,
        title: "User Account Deleted",
        message: `User ${session.user.name || session.user.email} has deleted their account.`,
        type: "ADMIN" as any,
        actionUrl: "/admin/users"
      }));
      
      await prisma.notification.createMany({
        data: notificationsData,
      });
    }

    return NextResponse.json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete account. Some records may still be linked." },
      { status: 500 }
    );
  }
}
