import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const deliverableSchema = z.object({
  title: z.string(),
  type: z.string().default("LINK"),
  url: z.string().url(),
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const campaignId = resolvedParams.id;

    const deliverables = await prisma.campaignDeliverable.findMany({
      where: { campaignRequestId: campaignId },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ deliverables }, { status: 200 });
  } catch (error) {
    console.error("Error fetching deliverables:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = deliverableSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { title, type, url } = result.data;
    const resolvedParams = await params;
    const campaignId = resolvedParams.id;

    const campaign = await prisma.campaignRequest.findUnique({
      where: { id: campaignId },
      include: { influencerProfile: true }
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (campaign.influencerProfile.userId !== session.user.id) {
      return NextResponse.json({ error: "Only the influencer can submit deliverables" }, { status: 403 });
    }

    if (campaign.progress < 100) {
      return NextResponse.json({ error: "You must complete all daily reports before submitting deliverables." }, { status: 400 });
    }

    const deliverable = await prisma.$transaction(async (tx) => {
      const created = await tx.campaignDeliverable.create({
        data: {
          campaignRequestId: campaignId,
          uploadedById: session.user.id,
          title,
          type,
          url,
          status: "SUBMITTED"
        }
      });

      await tx.campaignActivity.create({
        data: {
          campaignId,
          actorId: session.user.id,
          actorType: "INFLUENCER",
          action: "Deliverable Uploaded",
          description: `Uploaded deliverable: ${title}`
        }
      });

      return created;
    });

    return NextResponse.json({ deliverable }, { status: 201 });
  } catch (error) {
    console.error("Error saving deliverable:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
