import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const updatedBlog = await prisma.blog.update({
      where: { id },
      data: {
        status: "ARCHIVED",
        updatedById: session.user.id,
      }
    });

    return NextResponse.json({ success: true, data: updatedBlog });
  } catch (error: any) {
    console.error("Error archiving blog:", error);
    return NextResponse.json({ success: false, message: "Failed to archive blog" }, { status: 500 });
  }
}
