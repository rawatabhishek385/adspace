import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reportSchema = z.object({
  dayNumber: z.number().int().positive(),
  title: z.string(),
  description: z.string(),
  imageUrls: z.array(z.string()).optional(),
  videoUrls: z.array(z.string()).optional(),
  link: z.string().optional(),
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const campaignId = resolvedParams.id;

    const reports = await prisma.campaignDailyReport.findMany({
      where: { campaignId },
      orderBy: { dayNumber: "asc" }
    });

    return NextResponse.json({ reports }, { status: 200 });
  } catch (error) {
    console.error("Error fetching reports:", error);
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
    const result = reportSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { dayNumber, title, description, imageUrls, videoUrls, link } = result.data;
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
      return NextResponse.json({ error: "Only the influencer can submit reports" }, { status: 403 });
    }

    if (dayNumber > campaign.timelineDays) {
      return NextResponse.json({ error: `Cannot submit report for day ${dayNumber}. Timeline is ${campaign.timelineDays} days.` }, { status: 400 });
    }

    // Upsert the report
    const report = await prisma.campaignDailyReport.upsert({
      where: { campaignId_dayNumber: { campaignId, dayNumber } },
      update: { title, description, imageUrls: imageUrls || [], videoUrls: videoUrls || [], link, status: "SUBMITTED" },
      create: { campaignId, dayNumber, title, description, imageUrls: imageUrls || [], videoUrls: videoUrls || [], link, status: "SUBMITTED" }
    });

    // Auto-calculate progress
    const submittedCount = await prisma.campaignDailyReport.count({
      where: { campaignId, status: { in: ["SUBMITTED", "APPROVED"] } }
    });
    
    const progress = Math.min(100, Math.round((submittedCount / campaign.timelineDays) * 100));

    await prisma.$transaction([
      prisma.campaignRequest.update({
        where: { id: campaignId },
        data: { progress }
      }),
      prisma.campaignActivity.create({
        data: {
          campaignId,
          actorId: session.user.id,
          actorType: "INFLUENCER",
          action: `Submitted Day ${dayNumber} Report`,
          description: `Progress updated to ${progress}%`
        }
      })
    ]);

    // Notification to Brand
    await prisma.notification.create({
      data: {
        userId: campaign.requesterId,
        type: "SYSTEM",
        title: "Daily Report Submitted",
        message: `Influencer submitted the report for Day ${dayNumber} on "${campaign.title}".`,
        actionUrl: `/dashboard/campaigns/${campaignId}`
      }
    });

    return NextResponse.json({ report, progress }, { status: 200 });
  } catch (error) {
    console.error("Error saving report:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
