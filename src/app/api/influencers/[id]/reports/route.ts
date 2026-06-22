import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id: influencerId } = await params;
    const body = await request.json();
    const { reason, description } = body;

    if (!reason) {
      return NextResponse.json({ success: false, message: "Reason is required" }, { status: 400 });
    }

    // Verify influencer exists
    const influencer = await prisma.influencerProfile.findUnique({
      where: { id: influencerId },
    });

    if (!influencer) {
      return NextResponse.json({ success: false, message: "Influencer not found" }, { status: 404 });
    }

    if (influencer.userId === session.user.id) {
      return NextResponse.json({ success: false, message: "Cannot report your own profile" }, { status: 400 });
    }

    const report = await prisma.influencerReport.create({
      data: {
        reason,
        description,
        reporterId: session.user.id,
        influencerId,
      },
    });

    return NextResponse.json({ success: true, data: report });
  } catch (error) {
    console.error("Error submitting influencer report:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
