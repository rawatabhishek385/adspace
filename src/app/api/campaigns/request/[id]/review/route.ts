import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = reviewSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { rating, comment } = result.data;
    const resolvedParams = await params;
    const campaignId = resolvedParams.id;

    // Fetch the campaign request
    const campaign = await prisma.campaignRequest.findUnique({
      where: { id: campaignId },
      include: {
        influencerProfile: true,
        requester: true,
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (campaign.status !== "COMPLETED") {
      return NextResponse.json({ error: "Reviews can only be submitted for completed campaigns" }, { status: 400 });
    }

    const isRequester = campaign.requesterId === session.user.id;
    const isInfluencer = campaign.influencerProfile.userId === session.user.id;

    if (!isRequester && !isInfluencer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Client is reviewing Influencer
    if (isRequester) {
      const existingReview = await prisma.influencerReview.findUnique({
        where: {
          reviewerId_influencerId: {
            reviewerId: session.user.id,
            influencerId: campaign.influencerProfile.id,
          }
        }
      });

      if (existingReview) {
        return NextResponse.json({ error: "You have already reviewed this influencer" }, { status: 400 });
      }

      const [review, _] = await prisma.$transaction([
        prisma.influencerReview.create({
          data: {
            rating,
            comment,
            reviewerId: session.user.id,
            influencerId: campaign.influencerProfile.id,
          }
        }),
        prisma.campaignActivity.create({
          data: {
            campaignId,
            actorId: session.user.id,
            actorType: "BRAND",
            action: "Review Submitted",
            description: `Brand submitted a ${rating}-star review for the influencer.`,
          }
        }),
        prisma.notification.create({
          data: {
            userId: campaign.influencerProfile.userId,
            type: "SYSTEM",
            title: "New Review Received",
            message: `The brand has left a ${rating}-star review for the campaign "${campaign.title}".`,
            actionUrl: `/dashboard/campaigns/${campaignId}`
          }
        })
      ]);

      // Update influencer average rating
      const allReviews = await prisma.influencerReview.findMany({
        where: { influencerId: campaign.influencerProfile.id }
      });
      
      const totalRating = allReviews.reduce((acc: number, curr: { rating: number }) => acc + curr.rating, 0);
      const averageRating = totalRating / allReviews.length;

      await prisma.influencerProfile.update({
        where: { id: campaign.influencerProfile.id },
        data: {
          rating: averageRating,
          totalReviews: allReviews.length,
        }
      });

      return NextResponse.json({ review }, { status: 201 });
    }

    // Influencer is reviewing Client (No specific model for client reviews, we can just log activity for now, 
    // or if the schema doesn't have ClientReview, we just store it in activity)
    if (isInfluencer) {
      await prisma.$transaction([
        prisma.campaignActivity.create({
          data: {
            campaignId,
            actorId: session.user.id,
            actorType: "INFLUENCER",
            action: "Client Review Submitted",
            description: `Influencer left a ${rating}-star review for the brand. ${comment ? '"' + comment + '"' : ''}`,
          }
        }),
        prisma.notification.create({
          data: {
            userId: campaign.requesterId,
            type: "SYSTEM",
            title: "Influencer Left a Review",
            message: `The influencer left a ${rating}-star review for working with you on "${campaign.title}".`,
            actionUrl: `/dashboard/campaigns/${campaignId}`
          }
        })
      ]);

      return NextResponse.json({ success: true }, { status: 201 });
    }

  } catch (error) {
    console.error("Error submitting review:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
