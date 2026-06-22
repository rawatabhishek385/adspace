import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id: influencerId } = await params;
    const body = await request.json();
    const { rating, comment } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, message: "Valid rating (1-5) is required" }, { status: 400 });
    }

    // Verify influencer exists
    const influencer = await prisma.influencerProfile.findUnique({
      where: { id: influencerId },
    });

    if (!influencer) {
      return NextResponse.json({ success: false, message: "Influencer not found" }, { status: 404 });
    }

    if (influencer.userId === session.user.id) {
      return NextResponse.json({ success: false, message: "Cannot review your own profile" }, { status: 400 });
    }

    // Upsert review (create or update)
    const review = await prisma.influencerReview.upsert({
      where: {
        reviewerId_influencerId: {
          reviewerId: session.user.id,
          influencerId,
        },
      },
      update: {
        rating,
        comment,
      },
      create: {
        rating,
        comment,
        reviewerId: session.user.id,
        influencerId,
      },
    });

    // Recalculate average rating
    const allReviews = await prisma.influencerReview.findMany({
      where: { influencerId },
      select: { rating: true },
    });

    const totalReviews = allReviews.length;
    const averageRating = totalReviews > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    await prisma.influencerProfile.update({
      where: { id: influencerId },
      data: {
        rating: averageRating,
        totalReviews,
      },
    });

    return NextResponse.json({ success: true, data: review });
  } catch (error) {
    console.error("Error submitting influencer review:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
