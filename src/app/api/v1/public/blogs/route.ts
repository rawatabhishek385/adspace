import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // 1. Input Validation and Sanitized Parsing
    // Page: >= 1, fallback to 1
    let page = parseInt(searchParams.get("page") || "1");
    if (isNaN(page) || page < 1) {
      page = 1;
    }

    // Limit: between 1 and 50, fallback to 9
    let limit = parseInt(searchParams.get("limit") || "9");
    if (isNaN(limit) || limit < 1 || limit > 50) {
      limit = 9;
    }

    const skip = (page - 1) * limit;

    // Search: ignore empty or whitespace
    const searchRaw = searchParams.get("search") || "";
    const search = searchRaw.trim();

    // Category: exact slug
    const category = searchParams.get("category") || "";

    // Featured: boolean flag
    const featured = searchParams.get("featured") === "true";

    // Sort: fallback to 'latest' if unknown
    const sortRaw = searchParams.get("sort") || "latest";
    let orderBy: Prisma.BlogOrderByWithRelationInput | Prisma.BlogOrderByWithRelationInput[] = [{ publishedAt: "desc" }];
    
    switch (sortRaw) {
      case "oldest":
        orderBy = [{ publishedAt: "asc" }];
        break;
      case "popular":
        orderBy = [{ views: "desc" }, { publishedAt: "desc" }];
        break;
      case "readTime":
        orderBy = [{ readTime: "asc" }, { publishedAt: "desc" }];
        break;
      case "latest":
      default:
        orderBy = [{ publishedAt: "desc" }];
        break;
    }

    // 2. Strict Visibility Rules & Where Clause
    const where: Prisma.BlogWhereInput = {
      status: "PUBLISHED",
    };

    if (featured) {
      where.isFeatured = true;
    }

    if (category) {
      where.category = {
        slug: category,
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { excerpt: { contains: search } },
        { seoKeywords: { contains: search } },
        { tags: { some: { name: { contains: search } } } },
      ];
    }

    // 3. Performance Guidelines (Promise.all + strict select)
    const [blogs, totalCount] = await Promise.all([
      prisma.blog.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          coverImage: true,
          featuredImage: true,
          publishedAt: true,
          readTime: true,
          views: true,
          author: {
            select: {
              name: true,
              avatar: true,
            },
          },
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      }),
      prisma.blog.count({ where }),
    ]);

    // 4. Standardized API Response
    return NextResponse.json({
      success: true,
      data: blogs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching public blogs:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch blogs" },
      { status: 500 }
    );
  }
}
