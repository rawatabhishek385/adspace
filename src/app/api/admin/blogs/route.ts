import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "ALL";
  const categoryId = searchParams.get("categoryId") || "ALL";
  const isFeatured = searchParams.get("isFeatured");
  const sort = searchParams.get("sort") || "newest";

  let whereClause: any = {};

  if (search) {
    whereClause.OR = [
      { title: { contains: search } },
      { slug: { contains: search } }
    ];
  }

  if (status !== "ALL") {
    whereClause.status = status;
  }

  if (categoryId !== "ALL") {
    whereClause.categoryId = categoryId;
  }

  if (isFeatured !== null && isFeatured !== undefined && isFeatured !== "ALL") {
    whereClause.isFeatured = isFeatured === "true";
  }

  let orderByClause: any = { createdAt: "desc" };
  if (sort === "oldest") orderByClause = { createdAt: "asc" };
  if (sort === "most_viewed") orderByClause = { views: "desc" };
  if (sort === "last_updated") orderByClause = { updatedAt: "desc" };

  try {
    const blogs = await prisma.blog.findMany({
      where: whereClause,
      include: {
        category: true,
        author: { select: { id: true, name: true, avatar: true } },
        tags: true,
      },
      orderBy: orderByClause,
    });

    const stats = await Promise.all([
      prisma.blog.count(),
      prisma.blog.count({ where: { status: "PUBLISHED" } }),
      prisma.blog.count({ where: { status: "DRAFT" } }),
      prisma.blog.count({ where: { status: "ARCHIVED" } }),
      prisma.blog.count({ where: { isFeatured: true } }),
    ]);

    return NextResponse.json({
      success: true,
      data: blogs,
      stats: {
        total: stats[0],
        published: stats[1],
        draft: stats[2],
        archived: stats[3],
        featured: stats[4],
      }
    });
  } catch (error: any) {
    console.error("Error fetching admin blogs:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch blogs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title, slug, excerpt, content, coverImage, featuredImage, seoImage, categoryId, status, isFeatured, readTime, seoTitle, seoDescription, seoKeywords, canonicalUrl, tags } = body;

    if (!title || !slug) {
      return NextResponse.json({ success: false, message: "Title and slug are required" }, { status: 400 });
    }

    let currentSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    let originalSlug = currentSlug;
    let isUnique = false;
    let counter = 1;

    while (!isUnique) {
      const existing = await prisma.blog.findUnique({ where: { slug: currentSlug } });
      if (!existing) {
        isUnique = true;
      } else {
        currentSlug = `${originalSlug}-${counter}`;
        counter++;
      }
    }

    // Connect tags if provided
    let tagConnect: { id: string }[] = [];
    if (tags && Array.isArray(tags)) {
      tagConnect = tags.map((t: string) => ({ id: t }));
    }

    const newBlog = await prisma.blog.create({
      data: {
        title,
        slug: currentSlug,
        excerpt: excerpt || null,
        content: content || "",
        coverImage: coverImage || null,
        featuredImage: featuredImage || null,
        seoImage: seoImage || null,
        status: status || "DRAFT",
        isFeatured: isFeatured || false,
        readTime: readTime || 0,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        seoKeywords: seoKeywords || null,
        canonicalUrl: canonicalUrl || null,
        authorId: session.user.id,
        updatedById: session.user.id,
        categoryId: categoryId || null,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
        tags: {
          connect: tagConnect
        }
      }
    });

    return NextResponse.json({ success: true, data: newBlog, slugGenerated: currentSlug !== slug });
  } catch (error: any) {
    console.error("Error creating blog:", error);
    return NextResponse.json({ success: false, message: "Failed to create blog" }, { status: 500 });
  }
}
