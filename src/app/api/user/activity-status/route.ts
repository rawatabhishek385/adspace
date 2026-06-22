import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Check if user had any activity in the last 14 days
    const recentActivity = await prisma.userActivity.findFirst({
      where: {
        userId: session.user.id,
        createdAt: { gte: fourteenDaysAgo },
      },
    });

    return NextResponse.json({ 
      success: true, 
      isInactive: !recentActivity // True if no activity in last 14 days
    });
  } catch (error) {
    console.error("Failed to check activity status:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
