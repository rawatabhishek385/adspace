import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth.config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const banners = await prisma.announcementBanner.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: banners });
  } catch (error) {
    console.error("Fetch banners error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, message, imageUrl, actionUrl, isActive, targetState, targetCity } = body;

    if (!title || !message) {
      return NextResponse.json({ success: false, error: "Title and message are required" }, { status: 400 });
    }

    // If this banner is set to active, optionally deactivate others.
    // Assuming only one active banner at a time for the UI, but the schema allows multiple.
    if (isActive) {
      await prisma.announcementBanner.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    const banner = await prisma.announcementBanner.create({
      data: {
        title,
        message,
        imageUrl,
        actionUrl,
        isActive: isActive !== undefined ? isActive : true,
        targetState: targetState || null,
        targetCity: targetCity || null,
      },
    });

    return NextResponse.json({ success: true, data: banner });
  } catch (error) {
    console.error("Create banner error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
