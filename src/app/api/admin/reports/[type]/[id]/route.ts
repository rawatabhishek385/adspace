import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth.config";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum(["PENDING", "REVIEWED", "RESOLVED", "APPROVED", "DECLINED"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const { type, id } = resolvedParams;

    if (type !== "listing" && type !== "user") {
      return NextResponse.json(
        { error: "Invalid report type" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const result = updateStatusSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    const { status } = result.data;

    if (type === "listing") {
      await prisma.report.update({
        where: { id },
        data: { status },
      });
    } else if (type === "user") {
      await prisma.userReport.update({
        where: { id },
        data: { status },
      });
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("Failed to update report status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
