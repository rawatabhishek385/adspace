import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth.config";
import { z } from "zod";

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional().nullable(),
  revieweeId: z.string(),
  conversationId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const reviewerId = session.user.id;
    const body = await request.json();

    const validatedData = createReviewSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json({ success: false, message: "Invalid data", errors: validatedData.error.issues }, { status: 400 });
    }

    const { rating, comment, revieweeId, conversationId } = validatedData.data;

    // Self-review check
    if (reviewerId === revieweeId) {
      return NextResponse.json({ success: false, message: "You cannot review yourself" }, { status: 400 });
    }

    // Check conversation exists and user is part of it
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: true,
      },
    });

    if (!conversation) {
      return NextResponse.json({ success: false, message: "Conversation not found" }, { status: 404 });
    }

    if (conversation.buyerId !== reviewerId && conversation.ownerId !== reviewerId) {
      return NextResponse.json({ success: false, message: "You are not part of this conversation" }, { status: 403 });
    }

    // Validate 2-message rule
    if (conversation.messages.length < 2) {
      return NextResponse.json({ success: false, message: "A conversation must have at least 2 messages before a review can be left." }, { status: 403 });
    }

    // Check duplicate review
    const existingReview = await prisma.review.findUnique({
      where: {
        reviewerId_revieweeId_conversationId: {
          reviewerId,
          revieweeId,
          conversationId,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json({ success: false, message: "You have already reviewed this user for this conversation." }, { status: 400 });
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        rating,
        comment,
        reviewerId,
        revieweeId,
        conversationId,
      },
    });

    return NextResponse.json({ success: true, data: review }, { status: 201 });

  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
