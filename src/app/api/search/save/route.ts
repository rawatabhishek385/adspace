import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { query, city, categoryId } = await req.json();

    if (!query && !city && !categoryId) {
      return NextResponse.json({ success: false, error: "Empty search criteria" }, { status: 400 });
    }

    // Check if user already saved this exact search to prevent spam
    const existing = await prisma.savedSearch.findFirst({
      where: {
        userId: session.user.id,
        query: query || "",
        city: city || null,
        categoryId: categoryId || null
      }
    });

    if (existing) {
      return NextResponse.json({ success: true, message: "Already saved" });
    }

    await prisma.savedSearch.create({
      data: {
        userId: session.user.id,
        query: query || "",
        city: city || null,
        categoryId: categoryId || null
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save search error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save search" },
      { status: 500 }
    );
  }
}
