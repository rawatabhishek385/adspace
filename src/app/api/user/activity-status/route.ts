import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isOnline: true,
        lastSeen: true,
        influencerProfile: {
          select: {
            availabilityStatus: true,
            responseTime: true
          }
        }
      }
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json({
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      availabilityStatus: user.influencerProfile?.availabilityStatus || 'OFFLINE',
      responseTime: user.influencerProfile?.responseTime || null
    });
  } catch (error) {
    console.error("[ACTIVITY_STATUS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
