import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const campaign = await prisma.campaignRequest.findUnique({
      where: { id: resolvedParams.id },
      include: {
        requester: { select: { id: true, name: true, avatar: true } },
        influencerProfile: { select: { category: true, city: true, user: { select: { id: true, name: true, avatar: true } } } },
        conversations: { select: { id: true } },
        deliverables: true,
        dailyReports: { orderBy: { dayNumber: 'asc' } },
        statusHistory: { orderBy: { createdAt: 'desc' } },
        activities: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign request not found" }, { status: 404 });
    }

    const isRequester = campaign.requesterId === session.user.id;
    const isInfluencer = campaign.influencerProfile.user.id === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isRequester && !isInfluencer && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Error fetching campaign request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
