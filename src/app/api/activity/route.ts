import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import type { ActivityType } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { actionType, listingId, city, categoryId, searchTerm } = await req.json();

    if (!actionType) {
      return NextResponse.json({ success: false, message: "Missing actionType" }, { status: 400 });
    }

    // Debounce/deduplicate rapid identical events for the same user
    const recentActivity = await prisma.userActivity.findFirst({
      where: {
        userId: session.user.id,
        actionType: actionType as ActivityType,
        listingId: listingId || null,
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Within last 5 minutes
        },
      },
    });

    if (recentActivity) {
      return NextResponse.json({ success: true, message: "Activity already logged recently" });
    }

    await prisma.userActivity.create({
      data: {
        userId: session.user.id,
        actionType: actionType as ActivityType,
        listingId,
        city,
        categoryId,
        searchTerm,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to log activity:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
