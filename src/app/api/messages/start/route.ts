import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { processAutoReply } from "@/lib/autoReply";

const startSchema = z.object({
  listingId: z.string().min(1, "Listing ID is required"),
  message: z.string().min(1, "Message cannot be empty").max(1000, "Message is too long"),
  subject: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = startSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { listingId, message, subject } = result.data;
    const buyerId = session.user.id;

    // 1. Validate listing exists and is active
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, ownerId: true, title: true, isActive: true },
    });

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (!listing.isActive) {
      return NextResponse.json({ error: "Listing is no longer active" }, { status: 400 });
    }

    // 2. Prevent self-messaging
    if (listing.ownerId === buyerId) {
      return NextResponse.json({ error: "You cannot message yourself" }, { status: 400 });
    }

    // 3. Check if an active conversation already exists between this buyer and owner for this listing
    let conversation = await prisma.conversation.findFirst({
      where: {
        listingId,
        buyerId,
        status: "ACTIVE",
      },
    });

    // 4. Create or reuse conversation
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          listingId,
          buyerId,
          ownerId: listing.ownerId,
          subject: subject || `Inquiry: ${listing.title}`,
        },
      });
    }

    // 5. Create the message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: buyerId,
        content: message.trim(),
      },
    });

    // Update conversation's updatedAt and lastMessageAt timestamps
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date(), lastMessageAt: new Date() },
    });

    // 6. Trigger auto reply
    await processAutoReply(conversation.id, buyerId, listing.ownerId);

    return NextResponse.json({ conversationId: conversation.id }, { status: 201 });
  } catch (error) {
    console.error("Error starting conversation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
