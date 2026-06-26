import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getBlogSelect() {
  return {
    id: true,
    slug: true,
    title: true,
    excerpt: true,
    coverImage: true,
    featuredImage: true,
    readTime: true,
    publishedAt: true,
    category: {
      select: { name: true, slug: true },
    },
  };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const currentBlog = await prisma.blog.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: { tags: true },
    });

    if (!currentBlog) {
      return NextResponse.json(
        { success: false, message: "Blog not found" },
        { status: 404 }
      );
    }

    // Related Priority 1: Same Category
    let relatedBlogs = await prisma.blog.findMany({
      where: {
        status: "PUBLISHED",
        categoryId: currentBlog.categoryId,
        id: { not: currentBlog.id },
      },
      take: 3,
      orderBy: { publishedAt: "desc" },
      select: getBlogSelect(),
    });

    // Related Priority 2: Shared Tags
    if (relatedBlogs.length < 3 && currentBlog.tags.length > 0) {
      const tagIds = currentBlog.tags.map((t) => t.id);
      const existingIds = relatedBlogs.map((b) => b.id);
      
      const tagMatches = await prisma.blog.findMany({
        where: {
          status: "PUBLISHED",
          id: { notIn: [...existingIds, currentBlog.id] },
          tags: {
            some: { id: { in: tagIds } },
          },
        },
        take: 3 - relatedBlogs.length,
        orderBy: { publishedAt: "desc" },
        select: getBlogSelect(),
      });
      
      relatedBlogs = [...relatedBlogs, ...tagMatches];
    }

    // Related Priority 3: Fallback to latest
    if (relatedBlogs.length < 3) {
      const existingIds = relatedBlogs.map((b) => b.id);
      
      const latestBlogs = await prisma.blog.findMany({
        where: {
          status: "PUBLISHED",
          id: { notIn: [...existingIds, currentBlog.id] },
        },
        take: 3 - relatedBlogs.length,
        orderBy: { publishedAt: "desc" },
        select: getBlogSelect(),
      });
      
      relatedBlogs = [...relatedBlogs, ...latestBlogs];
    }

    return NextResponse.json({
      success: true,
      data: relatedBlogs,
    });
  } catch (error) {
    console.error("Error fetching related blogs:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch related blogs" },
      { status: 500 }
    );
  }
}
