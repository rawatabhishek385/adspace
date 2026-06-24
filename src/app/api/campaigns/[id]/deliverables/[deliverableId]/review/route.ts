import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { DeliverableStatus } from "@prisma/client";

const reviewSchema = z.object({
  status: z.nativeEnum(DeliverableStatus),
  reviewNote: z.string().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string, deliverableId: string }> }) {
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

    const { status, reviewNote } = result.data;
    const resolvedParams = await params;
    const campaignId = resolvedParams.id;
    const deliverableId = resolvedParams.deliverableId;

    const deliverable = await prisma.campaignDeliverable.findUnique({
      where: { id: deliverableId },
      include: { campaignRequest: { include: { influencerProfile: true } } }
    });

    if (!deliverable || deliverable.campaignRequestId !== campaignId) {
      return NextResponse.json({ error: "Deliverable not found" }, { status: 404 });
    }

    const isRequester = deliverable.campaignRequest.requesterId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isRequester && !isAdmin) {
      return NextResponse.json({ error: "Only the brand can review deliverables" }, { status: 403 });
    }

    const updatedDeliverable = await prisma.$transaction(async (tx) => {
      const updated = await tx.campaignDeliverable.update({
        where: { id: deliverableId },
        data: { status, reviewNote }
      });

      await tx.campaignActivity.create({
        data: {
          campaignId,
          actorId: session.user.id,
          actorType: isAdmin ? "ADMIN" : "BRAND",
          action: `Deliverable '${deliverable.title}' marked as ${status}`,
          description: reviewNote || `Status updated to ${status}`
        }
      });

      return updated;
    });

    // Notification
    if (status === "APPROVED" || status === "REVISION_REQUIRED") {
      await prisma.notification.create({
        data: {
          userId: deliverable.campaignRequest.influencerProfile.userId,
          type: "SYSTEM",
          title: `Deliverable ${status === "APPROVED" ? "Approved" : "Revision Requested"}`,
          message: `Your deliverable "${deliverable.title}" for "${deliverable.campaignRequest.title}" was ${status === "APPROVED" ? "approved" : "returned for revision"}.`,
          actionUrl: `/dashboard/campaigns/${campaignId}`
        }
      });
    }

    return NextResponse.json({ deliverable: updatedDeliverable }, { status: 200 });
  } catch (error) {
    console.error("Error reviewing deliverable:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
