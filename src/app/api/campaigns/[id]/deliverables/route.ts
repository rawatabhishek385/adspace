import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id: campaignId } = resolvedParams;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { title, fileUrl, fileType } = await req.json();

    if (!title || !fileUrl) {
      return NextResponse.json({ error: "Title and File URL are required" }, { status: 400 });
    }

    // Verify campaign exists and user is part of it
    const campaign = await prisma.campaignRequest.findUnique({
      where: { id: campaignId },
      include: { influencerProfile: true },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (campaign.influencerProfile.userId !== session.user.id) {
      return NextResponse.json({ error: "Only the assigned creator can upload deliverables" }, { status: 403 });
    }

    if (campaign.status !== "IN_PROGRESS" && campaign.status !== "SUBMITTED") {
      return NextResponse.json({ error: "Campaign must be in progress to upload deliverables" }, { status: 400 });
    }

    const deliverable = await prisma.campaignDeliverable.create({
      data: {
        title,
        fileUrl,
        fileType,
        campaignRequestId: campaignId,
        uploadedById: session.user.id,
      },
    });

    // Notify the Brand
    await prisma.notification.create({
      data: {
        userId: campaign.requesterId,
        type: "MESSAGE",
        title: "New Deliverable Uploaded",
        message: `A new deliverable "${title}" has been uploaded for your campaign.`,
        actionUrl: `/dashboard/my-campaigns/${campaignId}`,
      },
    });

    return NextResponse.json({ success: true, deliverable });
  } catch (error: any) {
    console.error("Error uploading deliverable:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
