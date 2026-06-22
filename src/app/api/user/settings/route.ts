import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { autoReplyEnabled: true, autoReplyMessage: true, preferredCity: true, notificationRadius: true },
    });

    return NextResponse.json({ success: true, settings: user });
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    const updateData: any = {};
    if (typeof data.autoReplyEnabled === "boolean") updateData.autoReplyEnabled = data.autoReplyEnabled;
    if (typeof data.autoReplyMessage === "string") updateData.autoReplyMessage = data.autoReplyMessage;
    if (typeof data.preferredCity === "string") updateData.preferredCity = data.preferredCity;
    if (typeof data.notificationRadius === "number") updateData.notificationRadius = data.notificationRadius;

    await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
