import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { DailyReportStatus } from "@prisma/client";

const reviewSchema = z.object({
  status: z.nativeEnum(DailyReportStatus),
  reviewNote: z.string().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string, reportId: string }> }) {
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
    const reportId = resolvedParams.reportId;

    const report = await prisma.campaignDailyReport.findUnique({
      where: { id: reportId },
      include: { campaign: { include: { influencerProfile: true } } }
    });

    if (!report || report.campaignId !== campaignId) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const isRequester = report.campaign.requesterId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isRequester && !isAdmin) {
      return NextResponse.json({ error: "Only the brand can review daily reports" }, { status: 403 });
    }

    const updatedReport = await prisma.$transaction(async (tx) => {
      const updated = await tx.campaignDailyReport.update({
        where: { id: reportId },
        data: { status, reviewNote }
      });

      await tx.campaignActivity.create({
        data: {
          campaignId,
          actorId: session.user.id,
          actorType: isAdmin ? "ADMIN" : "BRAND",
          action: `Daily Report Day ${report.dayNumber} marked as ${status}`,
          description: reviewNote || `Status updated to ${status}`
        }
      });

      return updated;
    });

    // Notification
    if (status === "APPROVED" || status === "REVISION_REQUIRED") {
      await prisma.notification.create({
        data: {
          userId: report.campaign.influencerProfile.userId,
          type: "SYSTEM",
          title: `Daily Report ${status === "APPROVED" ? "Approved" : "Revision Requested"}`,
          message: `Your report for Day ${report.dayNumber} on "${report.campaign.title}" was ${status === "APPROVED" ? "approved" : "returned for revision"}.`,
          actionUrl: `/dashboard/campaigns/${campaignId}`
        }
      });
    }

    return NextResponse.json({ report: updatedReport }, { status: 200 });
  } catch (error) {
    console.error("Error reviewing report:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
