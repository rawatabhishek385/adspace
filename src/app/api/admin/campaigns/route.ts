import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth.config";
import { PrismaClient, CampaignStatus, AudienceType } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const campaigns = await prisma.notificationCampaign.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: campaigns });
  } catch (error) {
    console.error("Fetch campaigns error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, message, imageUrl, actionUrl, targetAudience, targetState, targetCity, sendType, scheduledAt } = body;

    if (!title || !message || !targetAudience || !sendType) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const status = sendType === "INSTANT" ? "DRAFT" : "SCHEDULED";
    // We create it as DRAFT or SCHEDULED. A separate trigger or the cron job will mark it SENT when it actually sends.

    let campaign = await prisma.notificationCampaign.create({
      data: {
        title,
        message,
        imageUrl,
        actionUrl,
        targetAudience,
        targetState,
        targetCity,
        sendType,
        status: status as CampaignStatus,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
    });

    // If it's INSTANT, we should trigger the sending immediately.
    if (sendType === "INSTANT") {
      // 1. Mark as SENT
      campaign = await prisma.notificationCampaign.update({
        where: { id: campaign.id },
        data: { status: "SENT", sentAt: new Date() }
      });
      
      // 2. Determine target users
      let userQuery: any = { isActive: true };
      
      if (targetAudience === "LOCATION_SPECIFIC") {
        if (targetState) userQuery.state = targetState;
        if (targetCity) userQuery.city = { contains: targetCity };
      }
      // Note: for a fully scaled app, this logic should be a background job.
      
      // 3. Fetch user IDs
      const users = await prisma.user.findMany({
        where: userQuery,
        select: { id: true }
      });

      // 4. Create Notification records for each targeted user
      if (users.length > 0) {
        const notificationsData = users.map(u => ({
          userId: u.id,
          title: campaign.title,
          message: campaign.message,
          imageUrl: campaign.imageUrl,
          actionUrl: campaign.actionUrl,
          type: "ADMIN" as any, // Using the ADMIN notification type
        }));

        await prisma.notification.createMany({
          data: notificationsData,
          skipDuplicates: true
        });
      }
    }

    return NextResponse.json({ success: true, data: campaign });
  } catch (error) {
    console.error("Create campaign error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
