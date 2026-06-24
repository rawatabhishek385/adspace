import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Find conversations where:
    // 1. User is a participant
    // 2. Last message was > 3 days ago
    // 3. Status is ACTIVE or CLOSED (we don't mind either as long as there is chat history)
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ buyerId: userId }, { ownerId: userId }],
        lastMessageAt: { lt: threeDaysAgo },
      },
      include: {
        listing: {
          select: { id: true, title: true, slug: true, ownerId: true, media: true },
        },
        reviews: {
          where: { reviewerId: userId },
        },
        _count: {
          select: { messages: true }
        }
      },
    });

    // Filter out conversations where user has already left a review or hasn't communicated enough
    const pendingReminders = [];
    for (const conv of conversations) {
      if (conv._count.messages >= 2 && conv.reviews.length === 0 && conv.listing) {
        const isOwner = conv.listing.ownerId === userId;
        
        // Do not prompt the user to review their own listings
        if (isOwner) continue;

        const counterpartId = conv.ownerId;
        
        pendingReminders.push({
          conversationId: conv.id,
          listingId: conv.listing.id,
          listingTitle: conv.listing.title,
          listingSlug: conv.listing.slug,
          imageUrl: conv.listing.media.find((m) => m.type === "IMAGE")?.url || null,
          counterpartId,
          isOwner,
          lastMessageAt: conv.lastMessageAt,
        });
      }
    }

    return NextResponse.json({ success: true, data: pendingReminders });
  } catch (error) {
    console.error("Failed to fetch review reminders:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch review reminders" },
      { status: 500 }
    );
  }
}
