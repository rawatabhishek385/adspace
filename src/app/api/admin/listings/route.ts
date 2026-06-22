import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  const listings = await prisma.listing.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      category: { select: { id: true, name: true } },
      media: { select: { id: true, url: true, type: true }, take: 1 },
      _count: { select: { reports: true } },
    },
  });

  return NextResponse.json({ success: true, data: listings });
}
