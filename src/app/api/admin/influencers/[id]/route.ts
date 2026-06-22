import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ success: false, message: "Invalid status" }, { status: 400 });
    }

    const profile = await prisma.influencerProfile.update({
      where: { id },
      data: {
        status,
        ...(status === "APPROVED" 
          ? { approvedBy: session.user.id, approvedAt: new Date() } 
          : status === "PENDING"
          ? { approvedBy: null, approvedAt: null }
          : {}),
      },
    });

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error("Error updating influencer request:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
