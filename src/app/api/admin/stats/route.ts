import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  const [
    totalUsers,
    totalListings,
    activeListings,
    featuredListings,
    totalCategories,
    adminCount,
    disabledUsers,
    pendingReports,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.listing.count(),
    prisma.listing.count({ where: { isActive: true } }),
    prisma.listing.count({ where: { isFeatured: true } }),
    prisma.category.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { isActive: false } }),
    prisma.report.count({ where: { status: "PENDING" } }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      totalUsers,
      totalListings,
      activeListings,
      featuredListings,
      totalCategories,
      adminCount,
      disabledUsers,
      pendingReports,
    },
  });
}
