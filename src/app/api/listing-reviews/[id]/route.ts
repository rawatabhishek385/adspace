import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth.config";
import { z } from "zod";

const updateListingReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(500).optional().nullable(),
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const validatedData = updateListingReviewSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json({ success: false, message: "Invalid data", errors: validatedData.error.issues }, { status: 400 });
    }

    const review = await prisma.listingReview.findUnique({
      where: { id },
    });

    if (!review || review.isDeleted) {
      return NextResponse.json({ success: false, message: "Review not found" }, { status: 404 });
    }

    if (review.reviewerId !== session.user.id) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const updatedReview = await prisma.listingReview.update({
      where: { id },
      data: validatedData.data,
    });

    await updateListingAverage(review.listingId);

    return NextResponse.json({ success: true, data: updatedReview });

  } catch (error) {
    console.error("Error updating listing review:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const review = await prisma.listingReview.findUnique({
      where: { id },
    });

    if (!review || review.isDeleted) {
      return NextResponse.json({ success: false, message: "Review not found" }, { status: 404 });
    }

    if (review.reviewerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    // Soft delete
    await prisma.listingReview.update({
      where: { id },
      data: { isDeleted: true },
    });

    await updateListingAverage(review.listingId);

    return NextResponse.json({ success: true, message: "Listing review deleted successfully" });

  } catch (error) {
    console.error("Error deleting listing review:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
