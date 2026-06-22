import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth.config";
import { z } from "zod";

const createListingReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional().nullable(),
  listingId: z.string(),
  conversationId: z.string(),
});

async function updateListingAverage(listingId: string) {
  const reviews = await prisma.listingReview.findMany({
    where: { listingId, isDeleted: false },
  });

  const totalRatings = reviews.length;
  const averageRating = totalRatings > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalRatings
    : 0;

  await prisma.listing.update({
    where: { id: listingId },
    data: { totalRatings, averageRating },
  });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const reviewerId = session.user.id;
    const body = await request.json();

    const validatedData = createListingReviewSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json({ success: false, message: "Invalid data", errors: validatedData.error.issues }, { status: 400 });
    }

    const { rating, comment, listingId, conversationId } = validatedData.data;

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) {
      return NextResponse.json({ success: false, message: "Listing not found" }, { status: 404 });
    }

    // Block self-reviews
    if (listing.ownerId === reviewerId) {
      return NextResponse.json({ success: false, message: "You cannot review your own listing" }, { status: 400 });
    }

    // Check conversation exists and user is part of it
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: true },
    });

    if (!conversation || conversation.listingId !== listingId) {
      return NextResponse.json({ success: false, message: "Valid conversation not found for this listing" }, { status: 404 });
    }

    if (conversation.buyerId !== reviewerId && conversation.ownerId !== reviewerId) {
      return NextResponse.json({ success: false, message: "You are not part of this conversation" }, { status: 403 });
    }

    // Validate 2-message rule
    if (conversation.messages.length < 2) {
      return NextResponse.json({ success: false, message: "A conversation must have at least 2 messages before a review can be left." }, { status: 403 });
    }

    // Check duplicate review
    const existingReview = await prisma.listingReview.findUnique({
      where: {
        listingId_reviewerId: {
          listingId,
          reviewerId,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json({ success: false, message: "You have already reviewed this listing." }, { status: 400 });
    }

    // Create review
    const review = await prisma.listingReview.create({
      data: {
        rating,
        comment,
        listingId,
        reviewerId,
        conversationId,
      },
    });

    // Recalculate listing rating
    await updateListingAverage(listingId);

    return NextResponse.json({ success: true, data: review }, { status: 201 });

  } catch (error) {
    console.error("Error creating listing review:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get("listingId");

    if (!listingId) {
      return NextResponse.json({ success: false, message: "Listing ID is required" }, { status: 400 });
    }

    const reviews = await prisma.listingReview.findMany({
      where: { listingId, isDeleted: false },
      include: {
        reviewer: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: reviews });
  } catch (error) {
    console.error("Error fetching listing reviews:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
