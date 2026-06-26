import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const tags = await prisma.blogTag.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json({ success: true, data: tags });
  } catch (error: any) {
    console.error("Error fetching tags:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch tags" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: "Name is required" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    // Check if exists
    const existing = await prisma.blogTag.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ success: true, data: existing });
    }

    const tag = await prisma.blogTag.create({
      data: {
        name,
        slug
      }
    });

    return NextResponse.json({ success: true, data: tag });
  } catch (error: any) {
    console.error("Error creating tag:", error);
    return NextResponse.json({ success: false, message: "Failed to create tag" }, { status: 500 });
  }
}
