import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";



export async function POST(req: Request) {
  try {
    const { notificationId, campaignId, action } = await req.json();

    if (!action) {
      return NextResponse.json({ success: false, error: "Action is required" }, { status: 400 });
    }

    if (campaignId) {
      // Track campaign stats
      if (action === "OPEN") {
        await prisma.notificationCampaign.update({
          where: { id: campaignId },
          data: { openCount: { increment: 1 } }
        });
      } else if (action === "CLICK") {
        await prisma.notificationCampaign.update({
          where: { id: campaignId },
          data: { clickCount: { increment: 1 } }
        });
      }
    }

    if (notificationId && action === "OPEN") {
      // Mark specific notification as read if not already
      await prisma.notification.updateMany({
        where: { id: notificationId, isRead: false },
        data: { isRead: true }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tracking error:", error);
    return NextResponse.json({ success: false, error: "Failed to track action" }, { status: 500 });
  }
}
