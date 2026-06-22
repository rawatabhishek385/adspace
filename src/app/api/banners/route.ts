import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth.config";



export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userState = (session?.user as any)?.state;
    const userCity = (session?.user as any)?.city;

    // Filter banners: Must be active. 
    // And either targetState is null (meaning global)
    // or targetState matches user's state.
    // (If user has no state, they only see global banners)
    const banners = await prisma.announcementBanner.findMany({
      where: { 
        isActive: true,
        OR: [
          { targetState: null },
          ...(userState ? [{ targetState: userState }] : [])
        ]
      },
      orderBy: { createdAt: "desc" },
    });

    // We can do further client-side filtering for city if we want, or just return them.
    // Let's filter out ones where targetCity is set but doesn't match the user.
    const filteredBanners = banners.filter(b => {
      if (!b.targetCity) return true;
      if (!userCity) return false;
      return b.targetCity.toLowerCase() === userCity.toLowerCase();
    });

    return NextResponse.json({ success: true, data: filteredBanners });
  } catch (error) {
    console.error("Fetch active banners error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
