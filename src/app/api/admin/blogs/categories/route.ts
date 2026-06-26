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
    const categories = await prisma.blogCategory.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: "Name is required" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const category = await prisma.blogCategory.create({
      data: {
        name,
        slug,
        description
      }
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error: any) {
    console.error("Error creating category:", error);
    return NextResponse.json({ success: false, message: "Failed to create category" }, { status: 500 });
  }
}
