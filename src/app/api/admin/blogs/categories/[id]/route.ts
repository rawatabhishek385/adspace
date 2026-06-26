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
    const body = await req.json();
    const { name, description } = body;

    const existing = await prisma.blogCategory.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Category not found" }, { status: 404 });
    }

    let slug = existing.slug;
    if (name && name !== existing.name) {
      slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    const updatedCategory = await prisma.blogCategory.update({
      where: { id },
      data: {
        name: name || existing.name,
        slug,
        description: description !== undefined ? description : existing.description,
      }
    });

    return NextResponse.json({ success: true, data: updatedCategory });
  } catch (error: any) {
    console.error("Error updating category:", error);
    return NextResponse.json({ success: false, message: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    // Check if category has blogs
    const category = await prisma.blogCategory.findUnique({
      where: { id },
      include: { _count: { select: { blogs: true } } }
    });

    if (!category) {
      return NextResponse.json({ success: false, message: "Category not found" }, { status: 404 });
    }

    if (category._count.blogs > 0) {
      return NextResponse.json({ 
        success: false, 
        message: `Cannot delete category because it has ${category._count.blogs} blog(s) attached.` 
      }, { status: 400 });
    }

    await prisma.blogCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Category deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ success: false, message: "Failed to delete category" }, { status: 500 });
  }
}
