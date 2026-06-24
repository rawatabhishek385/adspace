import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CampaignRequestStatus } from "@prisma/client";

const statusSchema = z.object({
  status: z.nativeEnum(CampaignRequestStatus),
  cancellationReason: z.string().optional(),
  note: z.string().optional(), // Used for REVISION_REQUIRED
  paymentScreenshotUrl: z.string().optional(),
  paymentReferenceId: z.string().optional(),
  paymentVerificationNote: z.string().optional(),
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

    const { status, cancellationReason, note, paymentScreenshotUrl, paymentReferenceId, paymentVerificationNote } = result.data;
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

    const currentStatus = campaign.status;

    // Check valid transitions
    const validTransitions: Record<string, string[]> = {
      "PENDING": ["ACCEPTED", "REJECTED", "CANCELLED"],
      "ACCEPTED": ["IN_PROGRESS", "CANCELLED"],
      "IN_PROGRESS": ["DELIVERABLES_SUBMITTED", "CANCELLED"],
      "DELIVERABLES_SUBMITTED": ["REVISION_REQUIRED", "PAYMENT_PENDING", "CANCELLED"],
      "REVISION_REQUIRED": ["DELIVERABLES_SUBMITTED", "CANCELLED"],
      "PAYMENT_PENDING": ["PAYMENT_VERIFICATION_PENDING", "CANCELLED"],
      "PAYMENT_VERIFICATION_PENDING": ["PAYMENT_VERIFIED", "PAYMENT_REJECTED"],
      "PAYMENT_REJECTED": ["PAYMENT_VERIFICATION_PENDING", "CANCELLED"],
      "PAYMENT_VERIFIED": ["COMPLETED"],
      "COMPLETED": [],
      "REJECTED": [],
      "CANCELLED": []
    };

    if (!validTransitions[currentStatus]?.includes(status)) {
      return NextResponse.json({ error: `Cannot transition from ${currentStatus} to ${status}` }, { status: 400 });
    }

    // Role-based validation
    if (status === "CANCELLED" && !isRequester && !isAdmin) {
      return NextResponse.json({ error: "Only the requester or admin can cancel a campaign" }, { status: 403 });
    }

    if ((status === "ACCEPTED" || status === "REJECTED") && !isInfluencer) {
      return NextResponse.json({ error: "Only the influencer can accept or reject the campaign" }, { status: 403 });
    }
    
    if ((status === "IN_PROGRESS" || status === "DELIVERABLES_SUBMITTED") && !isInfluencer) {
      return NextResponse.json({ error: "Only the influencer can update progress" }, { status: 403 });
    }

    if ((status === "PAYMENT_PENDING" || status === "REVISION_REQUIRED" || status === "PAYMENT_VERIFICATION_PENDING") && !isAdmin && !isRequester) {
      return NextResponse.json({ error: "Only the brand can submit payment or request revisions" }, { status: 403 });
    }

    if ((status === "PAYMENT_VERIFIED" || status === "PAYMENT_REJECTED" || status === "COMPLETED") && !isAdmin && !isInfluencer) {
      return NextResponse.json({ error: "Only the influencer can verify payments or complete the campaign" }, { status: 403 });
    }

    // Prepare timestamp updates
    const timestampUpdates: any = {};
    if (status === "IN_PROGRESS") timestampUpdates.startedAt = new Date();
    if (status === "DELIVERABLES_SUBMITTED") timestampUpdates.submittedAt = new Date();
    if (status === "COMPLETED") timestampUpdates.completedAt = new Date();
    if (status === "PAYMENT_VERIFIED") {
      timestampUpdates.paymentVerifiedAt = new Date();
      timestampUpdates.paymentVerified = true;
    }
    if (status === "PAYMENT_REJECTED") {
      timestampUpdates.paymentRejectedAt = new Date();
      if (paymentVerificationNote) timestampUpdates.paymentVerificationNote = paymentVerificationNote;
    }
    if (status === "PAYMENT_VERIFICATION_PENDING") {
      if (paymentScreenshotUrl) timestampUpdates.paymentScreenshotUrl = paymentScreenshotUrl;
      if (paymentReferenceId) timestampUpdates.paymentReferenceId = paymentReferenceId;
    }
    if (status === "CANCELLED") {
      timestampUpdates.cancelledAt = new Date();
      if (cancellationReason) timestampUpdates.cancellationReason = cancellationReason;
    }

    // Use a transaction for consistency
    const [updatedCampaign, statusHistory, activity] = await prisma.$transaction([
      prisma.campaignRequest.update({
        where: { id: campaignId },
        data: { 
          status,
          ...timestampUpdates
        },
      }),
      prisma.campaignStatusHistory.create({
        data: {
          campaignId,
          fromStatus: currentStatus,
          toStatus: status,
          changedBy: session.user.id,
          note: note || cancellationReason || paymentVerificationNote || null
        }
      }),
      prisma.campaignActivity.create({
        data: {
          campaignId,
          actorId: session.user.id,
          actorType: isInfluencer ? "INFLUENCER" : isRequester ? "BRAND" : "ADMIN",
          action: `Status changed to ${status}`,
          description: note || cancellationReason || `Transitioned from ${currentStatus} to ${status}`
        }
      })
    ]);

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
    const createNotification = async (userId: string, title: string, message: string, url: string) => {
      await prisma.notification.create({
        data: { userId, type: "SYSTEM", title, message, actionUrl: url },
      });
    };

    const requesterUrl = `/dashboard/campaigns/${campaignId}`;
    const influencerUrl = `/dashboard/campaigns/${campaignId}`;

    if (status === "ACCEPTED" || status === "REJECTED") {
      await createNotification(
        campaign.requesterId,
        `Campaign ${status === "ACCEPTED" ? "Accepted" : "Rejected"}`,
        `Your campaign request "${campaign.title}" has been ${status.toLowerCase()} by the influencer.`,
        conversationId ? `/dashboard/messages/${conversationId}` : requesterUrl
      );
    } else if (status === "IN_PROGRESS") {
      await createNotification(
        campaign.requesterId,
        "Campaign Started",
        `The influencer has started working on "${campaign.title}".`,
        requesterUrl
      );
    } else if (status === "DELIVERABLES_SUBMITTED") {
      await createNotification(
        campaign.requesterId,
        "Deliverables Submitted",
        `The influencer has submitted deliverables for "${campaign.title}". Please review.`,
        requesterUrl
      );
    } else if (status === "REVISION_REQUIRED") {
      await createNotification(
        campaign.influencerProfile.userId,
        "Revision Requested",
        `The brand has requested a revision for "${campaign.title}". Note: ${note || "Please check details."}`,
        influencerUrl
      );
} else if (status === "PAYMENT_PENDING") {
      await createNotification(
        campaign.requesterId,
        "Payment Required",
        `Please upload your payment proof for "${campaign.title}".`,
        requesterUrl
      );
    } else if (status === "PAYMENT_VERIFICATION_PENDING") {
      await createNotification(
        campaign.influencerProfile.userId,
        "Payment Verification Needed",
        `The brand has uploaded payment proof for "${campaign.title}". Please verify.`,
        influencerUrl
      );
    } else if (status === "PAYMENT_VERIFIED") {
      await createNotification(
        campaign.requesterId,
        "Payment Verified",
        `The influencer verified your payment for "${campaign.title}".`,
        requesterUrl
      );
    } else if (status === "PAYMENT_REJECTED") {
      await createNotification(
        campaign.requesterId,
        "Payment Rejected",
        `Your payment proof for "${campaign.title}" was rejected. Please re-upload.`,
        requesterUrl
      );
    } else if (status === "COMPLETED") {
      await createNotification(
        campaign.influencerProfile.userId,
        "Campaign Completed",
        `The campaign "${campaign.title}" has been successfully completed!`,
        influencerUrl
      );
      await createNotification(
        campaign.requesterId,
        "Campaign Completed",
        `The campaign "${campaign.title}" has been successfully completed!`,
        requesterUrl
      );
    } else if (status === "CANCELLED") {
      await createNotification(
        campaign.influencerProfile.userId,
        "Campaign Cancelled",
        `The campaign request "${campaign.title}" was cancelled by the brand.`,
        "/dashboard/campaigns"
      );
    }

    return NextResponse.json({ campaign: updatedCampaign, conversationId }, { status: 200 });
  } catch (error) {
    console.error("Error updating campaign status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
