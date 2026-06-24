import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch conversations where the user is either the buyer or owner
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ buyerId: userId }, { ownerId: userId }],
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            media: {
              where: { type: "IMAGE" },
              select: { url: true },
              take: 1,
            },
          },
        },
        campaign: {
          select: {
            id: true,
            title: true,
          }
        },
        buyer: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        owner: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        messages: {
          where: { isDeleted: false },
          orderBy: { createdAt: "desc" },
          take: 1, // Get the last message
        },
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                isDeleted: false,
                senderId: { not: userId }, // Unread messages sent by the OTHER person
              },
            },
          },
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    // Fetch pinned conversations for the user
    const pinnedConversations = await prisma.pinnedConversation.findMany({
      where: { userId },
      select: { conversationId: true }
    });
    const pinnedSet = new Set(pinnedConversations.map(p => p.conversationId));

    // Format the response to make it easy for the frontend to consume
    const formattedConversations = conversations.map((conv) => {
      const isOwner = conv.ownerId === userId;
      const otherUser = isOwner ? conv.buyer : conv.owner;
      const lastMessage = conv.messages[0];

      return {
        id: conv.id,
        subject: conv.subject,
        status: conv.status,
        updatedAt: conv.updatedAt,
        isPinned: pinnedSet.has(conv.id),
        listing: conv.listing ? {
          id: conv.listing.id,
          title: conv.listing.title,
          thumbnail: conv.listing.media[0]?.url || null,
        } : {
          id: conv.campaign?.id || "campaign",
          title: conv.campaign?.title || "Campaign Request",
          thumbnail: null,
        },
        otherUser: {
          id: otherUser.id,
          name: otherUser.name,
          email: otherUser.email,
          avatar: otherUser.avatar,
        },
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
              isMine: lastMessage.senderId === userId,
            }
          : null,
        unreadCount: conv._count.messages,
      };
    });

    // Sort pinned conversations to the top, then by lastMessageAt
    formattedConversations.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return NextResponse.json(formattedConversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const createConversationSchema = z.object({
  ownerId: z.string().min(1, "Owner ID is required"),
  type: z.enum(["INFLUENCER"]),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = createConversationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { ownerId, type } = result.data;
    const buyerId = session.user.id;

    if (buyerId === ownerId) {
      return NextResponse.json({ error: "You cannot message yourself" }, { status: 400 });
    }

    // Check if conversation already exists
    let conversation = await prisma.conversation.findFirst({
      where: {
        buyerId,
        ownerId,
        type: type,
        status: "ACTIVE"
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          buyerId,
          ownerId,
          type: type,
          subject: "Influencer Collaboration",
        }
      });
    }

    return NextResponse.json({ conversationId: conversation.id }, { status: 201 });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
