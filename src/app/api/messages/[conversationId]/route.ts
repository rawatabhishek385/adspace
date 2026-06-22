import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { processAutoReply } from "@/lib/autoReply";

interface RouteParams {
  params: Promise<{ conversationId: string }>;
}

// Ensure the user is a participant of the conversation
async function getValidatedConversation(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      listing: { 
        select: { 
          id: true, 
          title: true, 
          isActive: true,
          city: true,
          country: true,
          price: true,
          pricePeriod: true,
          media: { select: { url: true, type: true } }
        } 
      },
      campaign: {
        select: {
          id: true,
          title: true,
        }
      },
      buyer: { select: { id: true, name: true, avatar: true } },
      owner: { select: { id: true, name: true, avatar: true } },
      reviews: {
        where: { reviewerId: userId },
        select: { id: true },
      },
      pinnedMessage: {
        select: { id: true, content: true, sender: { select: { name: true } } }
      }
    },
  });

  if (!conversation) {
    return { error: "Conversation not found", status: 404 };
  }

  if (conversation.buyerId !== userId && conversation.ownerId !== userId) {
    return { error: "Forbidden", status: 403 };
  }

  const hasReviewed = conversation.reviews.length > 0;
  
  const reportCount = await prisma.userReport.count({
    where: { conversationId }
  });
  const hasReport = reportCount > 0;

  const conversationData = { ...conversation, hasReviewed, hasReport };

  return { conversation: conversationData };
}

// GET: Fetch message thread
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const validation = await getValidatedConversation(resolvedParams.conversationId, session.user.id);
    if (validation.error) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId: resolvedParams.conversationId,
        isDeleted: false,
        hiddenBy: {
          none: {
            userId: session.user.id
          }
        }
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        content: true,
        messageType: true,
        imageUrl: true,
        fileUrl: true,
        fileName: true,
        fileSize: true,
        isEdited: true,
        editedAt: true,
        isDeleted: true,
        isStarred: true,
        replyToId: true,
        createdAt: true,
        isRead: true,
        isDelivered: true,
        senderId: true,
        replyTo: {
          select: { id: true, content: true, senderId: true, messageType: true, fileName: true, isDeleted: true }
        },
        reactions: {
          select: { id: true, emoji: true, userId: true }
        }
      },
    });

    return NextResponse.json({
      conversation: validation.conversation,
      messages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Send a new message to the conversation
const messageSchema = z.object({
  content: z.string().max(1000, "Message is too long").optional(),
  messageType: z.enum(["TEXT", "IMAGE", "FILE"]).optional().default("TEXT"),
  imageUrl: z.string().optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  replyToId: z.string().optional(),
});

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const result = messageSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });

    const resolvedParams = await params;
    const validation = await getValidatedConversation(resolvedParams.conversationId, session.user.id);
    if (validation.error) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    if (validation.conversation?.status === "CLOSED") {
      return NextResponse.json({ error: "Cannot send messages to a closed conversation" }, { status: 400 });
    }

    const { content, messageType, imageUrl, fileUrl, fileName, fileSize, replyToId } = result.data;
    
    if (messageType === "TEXT" && (!content || content.trim() === "")) {
      return NextResponse.json({ error: "Text messages cannot be empty" }, { status: 400 });
    }

    const newMessage = await prisma.message.create({
      data: {
        conversationId: resolvedParams.conversationId,
        senderId: session.user.id,
        content: content ? content.trim() : "",
        messageType,
        imageUrl,
        fileUrl,
        fileName,
        fileSize,
        replyToId,
      },
      include: {
        replyTo: { select: { id: true, content: true, senderId: true, messageType: true, fileName: true, isDeleted: true } },
        reactions: { select: { id: true, emoji: true, userId: true } }
      }
    });

    // Update conversation's updatedAt and lastMessageAt timestamps
    await prisma.conversation.update({
      where: { id: resolvedParams.conversationId },
      data: { updatedAt: new Date(), lastMessageAt: new Date() },
    });

    // Log CHAT activity for recommendations
    if (validation.conversation?.listing) {
      await prisma.userActivity.create({
        data: {
          userId: session.user.id,
          actionType: "CHAT",
          listingId: validation.conversation.listing.id,
          categoryId: null, // We don't have categoryId here easily, but city helps
          city: validation.conversation.listing.city,
        },
      });
    }

    // Trigger auto reply
    const receiverId = validation.conversation!.buyerId === session.user.id 
      ? validation.conversation!.ownerId 
      : validation.conversation!.buyerId;
    await processAutoReply(resolvedParams.conversationId, session.user.id, receiverId);

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: Mark messages as read
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const validation = await getValidatedConversation(resolvedParams.conversationId, session.user.id);
    if (validation.error) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    await prisma.message.updateMany({
      where: {
        conversationId: resolvedParams.conversationId,
        senderId: { not: session.user.id }, // Only mark messages sent by the other person as read
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
