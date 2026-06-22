import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth.config";
import { z } from "zod";

const reportUserSchema = z.object({
  reason: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  reportedUserId: z.string(),
  conversationId: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = reportUserSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json({ success: false, message: "Invalid data", errors: validatedData.error.issues }, { status: 400 });
    }

    const { reason, description, reportedUserId, conversationId } = validatedData.data;

    // Can't report yourself
    if (reportedUserId === session.user.id) {
      return NextResponse.json({ success: false, message: "You cannot report yourself" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: reportedUserId } });
    if (!targetUser) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // Check duplicate report (same reporter, same target, same conversation)
    const existing = await prisma.userReport.findFirst({
      where: {
        reporterId: session.user.id,
        reportedUserId,
        conversationId: conversationId || null,
      },
    });
    if (existing) {
      return NextResponse.json({ success: false, message: "You have already submitted a report for this user in this conversation" }, { status: 400 });
    }

    const report = await prisma.userReport.create({
      data: {
        reason,
        description,
        reporterId: session.user.id,
        reportedUserId,
        conversationId: conversationId || null,
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
        title: "New User Report",
        message: `User "${targetUser.name}" has been reported for: ${reason}.`,
        type: "ADMIN" as any,
        actionUrl: "/admin/reports" // assuming a generic reports page
      }));
      
      await prisma.notification.createMany({
        data: notificationsData,
      });
    }

    // Close all conversations between these two users
    await prisma.conversation.updateMany({
      where: {
        OR: [
          { buyerId: session.user.id, ownerId: reportedUserId },
          { ownerId: session.user.id, buyerId: reportedUserId },
        ],
      },
      data: { status: "CLOSED" },
    });

    return NextResponse.json({ success: true, data: report }, { status: 201 });
  } catch (error) {
    console.error("Error creating user report:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
