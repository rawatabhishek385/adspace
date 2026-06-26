import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const blog = await prisma.blog.findUnique({
      where: { id },
      include: {
        category: true,
        tags: true,
      }
    });

    if (!blog) {
      return NextResponse.json({ success: false, message: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: blog });
  } catch (error: any) {
    console.error("Error fetching blog:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch blog" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title, slug, excerpt, content, coverImage, featuredImage, seoImage, categoryId, status, isFeatured, readTime, seoTitle, seoDescription, seoKeywords, canonicalUrl, tags } = body;

    const existingBlog = await prisma.blog.findUnique({ where: { id } });
    if (!existingBlog) {
      return NextResponse.json({ success: false, message: "Blog not found" }, { status: 404 });
    }

    let currentSlug = slug || existingBlog.slug;
    
    if (slug && slug !== existingBlog.slug) {
      currentSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      let originalSlug = currentSlug;
      let isUnique = false;
      let counter = 1;

      while (!isUnique) {
        const existing = await prisma.blog.findUnique({ where: { slug: currentSlug } });
        if (!existing || existing.id === id) {
          isUnique = true;
        } else {
          currentSlug = `${originalSlug}-${counter}`;
          counter++;
        }
      }
    }

    let tagConnect: { id: string }[] = [];
    if (tags && Array.isArray(tags)) {
      tagConnect = tags.map((t: string) => ({ id: t }));
    }

    const updatedBlog = await prisma.blog.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existingBlog.title,
        slug: currentSlug,
        excerpt: excerpt !== undefined ? excerpt : existingBlog.excerpt,
        content: content !== undefined ? content : existingBlog.content,
        coverImage: coverImage !== undefined ? coverImage : existingBlog.coverImage,
        featuredImage: featuredImage !== undefined ? featuredImage : existingBlog.featuredImage,
        seoImage: seoImage !== undefined ? seoImage : existingBlog.seoImage,
        status: status !== undefined ? status : existingBlog.status,
        isFeatured: isFeatured !== undefined ? isFeatured : existingBlog.isFeatured,
        readTime: readTime !== undefined ? readTime : existingBlog.readTime,
        seoTitle: seoTitle !== undefined ? seoTitle : existingBlog.seoTitle,
        seoDescription: seoDescription !== undefined ? seoDescription : existingBlog.seoDescription,
        seoKeywords: seoKeywords !== undefined ? seoKeywords : existingBlog.seoKeywords,
        canonicalUrl: canonicalUrl !== undefined ? canonicalUrl : existingBlog.canonicalUrl,
        updatedById: session.user.id,
        categoryId: categoryId !== undefined ? categoryId : existingBlog.categoryId,
        publishedAt: status === "PUBLISHED" && existingBlog.status !== "PUBLISHED" ? new Date() : existingBlog.publishedAt,
        tags: {
          set: [],
          connect: tagConnect
        }
      }
    });

    return NextResponse.json({ success: true, data: updatedBlog, slugGenerated: currentSlug !== slug && currentSlug !== existingBlog.slug });
  } catch (error: any) {
    console.error("Error updating blog:", error);
    return NextResponse.json({ success: false, message: "Failed to update blog" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    await prisma.blog.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Blog deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting blog:", error);
    return NextResponse.json({ success: false, message: "Failed to delete blog" }, { status: 500 });
  }
}
