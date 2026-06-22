import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth.config";
import { z } from "zod";

const reportListingSchema = z.object({
  reason: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  listingId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = reportListingSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json({ success: false, message: "Invalid data", errors: validatedData.error.issues }, { status: 400 });
    }

    const { reason, description, listingId } = validatedData.data;

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) {
      return NextResponse.json({ success: false, message: "Listing not found" }, { status: 404 });
    }

    // Can't report own listing
    if (listing.ownerId === session.user.id) {
      return NextResponse.json({ success: false, message: "You cannot report your own listing" }, { status: 400 });
    }

    // Check duplicate report
    const existing = await prisma.report.findFirst({
      where: { listingId, reporterId: session.user.id, status: "PENDING" },
    });
    if (existing) {
      return NextResponse.json({ success: false, message: "You have already submitted a report for this listing" }, { status: 400 });
    }

    const report = await prisma.report.create({
      data: {
        reason,
        description,
        listingId,
        reporterId: session.user.id,
      },
    });

    // Notify admins
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    if (admins.length > 0) {
      const notificationsData = admins.map(admin => ({
        userId: admin.id,
        title: "New Listing Report",
        message: `Listing "${listing.title}" has been reported for: ${reason}.`,
        type: "ADMIN" as any,
        actionUrl: "/admin/reports" // assuming a generic reports page or listings page
      }));
      
      await prisma.notification.createMany({
        data: notificationsData,
      });
    }

    return NextResponse.json({ success: true, data: report }, { status: 201 });
  } catch (error) {
    console.error("Error creating listing report:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
