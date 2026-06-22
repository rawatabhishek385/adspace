import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["ACCEPTED", "IN_PROGRESS", "SUBMITTED", "REJECTED", "CANCELLED", "COMPLETED"]),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = statusSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { status } = result.data;
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
      return NextResponse.json({ error: "Campaign request not found" }, { status: 404 });
    }

    const isRequester = campaign.requesterId === session.user.id;
    const isInfluencer = campaign.influencerProfile.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isRequester && !isInfluencer && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validation rules based on current status and user role
    const currentStatus = campaign.status;

    if (status === "CANCELLED" && !isRequester) {
      return NextResponse.json({ error: "Only the requester can cancel a campaign" }, { status: 403 });
    }

    if ((status === "ACCEPTED" || status === "REJECTED") && !isInfluencer) {
      return NextResponse.json({ error: "Only the influencer can accept or reject the campaign" }, { status: 403 });
    }
    
    if ((status === "IN_PROGRESS" || status === "SUBMITTED") && !isInfluencer) {
      return NextResponse.json({ error: "Only the influencer can update progress" }, { status: 403 });
    }

    if (status === "COMPLETED" && !isAdmin && !isRequester) {
      return NextResponse.json({ error: "Only the brand can approve and complete the campaign" }, { status: 403 });
    }

    // Check valid transitions
    const validTransitions: Record<string, string[]> = {
      "PENDING": ["ACCEPTED", "REJECTED", "CANCELLED"],
      "ACCEPTED": ["IN_PROGRESS", "CANCELLED"],
      "IN_PROGRESS": ["SUBMITTED", "CANCELLED"],
      "SUBMITTED": ["COMPLETED", "CANCELLED"],
      "COMPLETED": [],
      "REJECTED": [],
      "CANCELLED": []
    };

    if (!validTransitions[currentStatus]?.includes(status)) {
      return NextResponse.json({ error: `Cannot transition from ${currentStatus} to ${status}` }, { status: 400 });
    }

    // Process the status change
    const updatedCampaign = await prisma.campaignRequest.update({
      where: { id: campaignId },
      data: { 
        status,
        ...(status === "IN_PROGRESS" ? { startedAt: new Date() } : {}),
        ...(status === "SUBMITTED" ? { submittedAt: new Date() } : {}),
        ...(status === "COMPLETED" ? { completedAt: new Date() } : {})
      },
    });

    // If accepted, automatically create a conversation for them
    let conversationId = null;
    if (status === "ACCEPTED") {
      const existingConversation = await prisma.conversation.findFirst({
        where: { campaignId },
      });

      if (!existingConversation) {
        const conversation = await prisma.conversation.create({
          data: {
            campaignId,
            buyerId: campaign.requesterId,
            ownerId: campaign.influencerProfile.userId,
            subject: `Campaign: ${campaign.title}`,
          },
        });
        conversationId = conversation.id;
      } else {
        conversationId = existingConversation.id;
      }
    }

    // Notifications
    if (status === "ACCEPTED" || status === "REJECTED") {
      await prisma.notification.create({
        data: {
          userId: campaign.requesterId,
          type: "SYSTEM",
          title: `Campaign ${status === "ACCEPTED" ? "Accepted" : "Rejected"}`,
          message: `Your campaign request "${campaign.title}" has been ${status.toLowerCase()} by the influencer.`,
          actionUrl: conversationId ? `/dashboard/messages/${conversationId}` : "/dashboard/my-campaigns",
        },
      });
    } else if (status === "IN_PROGRESS") {
      await prisma.notification.create({
        data: {
          userId: campaign.requesterId,
          type: "SYSTEM",
          title: "Campaign Started",
          message: `The influencer has started working on "${campaign.title}".`,
          actionUrl: `/dashboard/my-campaigns/${campaignId}`,
        },
      });
    } else if (status === "SUBMITTED") {
      await prisma.notification.create({
        data: {
          userId: campaign.requesterId,
          type: "SYSTEM",
          title: "Deliverables Submitted",
          message: `The influencer has submitted deliverables for "${campaign.title}". Please review.`,
          actionUrl: `/dashboard/my-campaigns/${campaignId}`,
        },
      });
    } else if (status === "COMPLETED") {
      await prisma.notification.create({
        data: {
          userId: campaign.influencerProfile.userId,
          type: "SYSTEM",
          title: "Campaign Approved",
          message: `The brand has approved your submission for "${campaign.title}"!`,
          actionUrl: `/dashboard/campaigns/${campaignId}`,
        },
      });
    } else if (status === "CANCELLED") {
      await prisma.notification.create({
        data: {
          userId: campaign.influencerProfile.userId,
          type: "SYSTEM",
          title: "Campaign Cancelled",
          message: `The campaign request "${campaign.title}" was cancelled by the brand.`,
          actionUrl: "/dashboard/campaigns",
        },
      });
    }

    return NextResponse.json({ campaign: updatedCampaign, conversationId }, { status: 200 });
  } catch (error) {
    console.error("Error updating campaign status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
