import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const influencerProfile = await prisma.influencerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!influencerProfile) {
      return NextResponse.json({ error: "No influencer profile found" }, { status: 404 });
    }

    const { title, description, imageUrl, platform, brandName, campaignType, campaignYear } = await req.json();

    if (!title || !imageUrl) {
      return NextResponse.json({ error: "Title and Image URL are required" }, { status: 400 });
    }

    const portfolioItem = await prisma.portfolioItem.create({
      data: {
        title,
        description,
        imageUrl,
        platform,
        brandName,
        campaignType,
        campaignYear: campaignYear ? parseInt(campaignYear) : null,
        influencerId: influencerProfile.id,
      },
    });

    return NextResponse.json({ success: true, item: portfolioItem });
  } catch (error: any) {
    console.error("Error adding portfolio item:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
