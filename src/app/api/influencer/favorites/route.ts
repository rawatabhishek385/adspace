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

    const { influencerId } = await req.json();

    if (!influencerId) {
      return NextResponse.json({ error: "Influencer ID is required" }, { status: 400 });
    }

    const existingFavorite = await prisma.favoriteInfluencer.findUnique({
      where: {
        userId_influencerId: {
          userId: session.user.id,
          influencerId,
        },
      },
    });

    if (existingFavorite) {
      // Remove from favorites
      await prisma.favoriteInfluencer.delete({
        where: { id: existingFavorite.id },
      });
      return NextResponse.json({ success: true, favorited: false });
    } else {
      // Add to favorites
      await prisma.favoriteInfluencer.create({
        data: {
          userId: session.user.id,
          influencerId,
        },
      });
      return NextResponse.json({ success: true, favorited: true });
    }
  } catch (error: any) {
    console.error("Error toggling favorite:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
