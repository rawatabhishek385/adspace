import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const unreadCount = await prisma.message.count({
      where: {
        isRead: false,
        isDeleted: false,
        conversation: {
          OR: [
            { buyerId: session.user.id },
            { ownerId: session.user.id },
          ],
          status: "ACTIVE", // Only count messages in active conversations
        },
        senderId: {
          not: session.user.id, // Only messages sent by others
        },
      },
    });

    return NextResponse.json({ count: unreadCount });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
