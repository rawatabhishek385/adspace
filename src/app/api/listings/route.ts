import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { generateUniqueSlug } from "@/lib/slug";

const includeRelations = {
  owner: { select: { id: true, name: true } },
  category: { select: { id: true, name: true } },
  media: { select: { id: true, url: true, publicId: true, type: true } },
};

// ─── GET /api/listings — List listings (public, with filters + pagination) ──

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const country = searchParams.get("country");
    const city = searchParams.get("city");
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const ownerId = searchParams.get("ownerId");
    const featured = searchParams.get("featured");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sort = searchParams.get("sort");
    const favoritesOnly = searchParams.get("favoritesOnly");

    const where: Record<string, unknown> = { isActive: true };

    if (country) where.country = { contains: country };
    if (city) where.city = { contains: city };
    if (categoryId) where.categoryId = categoryId;
    if (featured === "true") where.isFeatured = true;
    if (ownerId) {
      where.ownerId = ownerId;
      delete where.isActive; // owners see all their listings
    }

    if (favoritesOnly === "true") {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) {
        where.favorites = { some: { userId: session.user.id } };
      }
    }

    // Price range filter
    if (minPrice || maxPrice) {
      const priceFilter: Record<string, number> = {};
      if (minPrice) priceFilter.gte = parseFloat(minPrice);
      if (maxPrice) priceFilter.lte = parseFloat(maxPrice);
      where.price = priceFilter;
    }

    // Full-text search across multiple fields
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { city: { contains: search } },
        { country: { contains: search } },
        { address: { contains: search } },
      ];
    }

    // Sort order
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderBy: any[] = [{ isFeatured: "desc" }];
    if (sort === "oldest") {
      orderBy.push({ createdAt: "asc" });
    } else if (sort === "price_asc") {
      orderBy.push({ price: "asc" });
    } else if (sort === "price_desc") {
      orderBy.push({ price: "desc" });
    } else if (sort === "rating") {
      orderBy.push({ averageRating: "desc" });
    } else if (sort === "views") {
      orderBy.push({ viewCount: "desc" });
    } else {
      orderBy.push({ createdAt: "desc" }); // default 'newest'
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: includeRelations,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.listing.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: listings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching listings:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch listings" },
      { status: 500 }
    );
  }
}

// ─── POST /api/listings — Create listing (auth required) ─────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validation
    if (!body.title?.trim()) {
      return NextResponse.json({ success: false, message: "Title is required" }, { status: 400 });
    }
    if (!body.description?.trim()) {
      return NextResponse.json({ success: false, message: "Description is required" }, { status: 400 });
    }
    if (!body.categoryId) {
      return NextResponse.json({ success: false, message: "Category is required" }, { status: 400 });
    }
    if (!body.country?.trim()) {
      return NextResponse.json({ success: false, message: "Country is required" }, { status: 400 });
    }
    if (!body.city?.trim()) {
      return NextResponse.json({ success: false, message: "City is required" }, { status: 400 });
    }
    if (!body.address?.trim()) {
      return NextResponse.json({ success: false, message: "Address is required" }, { status: 400 });
    }
    if (body.price == null || body.price <= 0) {
      return NextResponse.json({ success: false, message: "Valid price is required" }, { status: 400 });
    }
    if (body.mediaUrls && body.mediaUrls.length > 5) {
      return NextResponse.json({ success: false, message: "A maximum of 5 media files is allowed" }, { status: 400 });
    }

    // Check category exists
    const category = await prisma.category.findUnique({ where: { id: body.categoryId } });
    if (!category) {
      return NextResponse.json({ success: false, message: "Category not found" }, { status: 404 });
    }

    // Generate unique slug from title
    const slug = await generateUniqueSlug(body.title);

    const listing = await prisma.listing.create({
      data: {
        slug,
        title: body.title.trim(),
        description: body.description.trim(),
        country: body.country.trim(),
        city: body.city.trim(),
        address: body.address.trim(),
        latitude: body.latitude || 0,
        longitude: body.longitude || 0,
        width: body.width || null,
        height: body.height || null,
        indoorOutdoor: body.indoorOutdoor,
        digitalPhysical: body.digitalPhysical,
        price: body.price,
        pricePeriod: body.pricePeriod,
        ownerId: session.user.id,
        categoryId: body.categoryId,
        media: body.mediaUrls?.length
          ? {
              create: body.mediaUrls.map((m: { url: string; publicId?: string; type: string }) => ({
                url: m.url,
                publicId: m.publicId || null,
                type: m.type as "IMAGE" | "VIDEO",
              })),
            }
          : undefined,
      },
      include: includeRelations,
    });

    // Notify admins
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    if (admins.length > 0) {
      const notificationsData = admins.map(admin => ({
        userId: admin.id,
        title: "New Listing Created",
        message: `A new space "${listing.title}" has been listed by ${session.user?.name || "a user"}.`,
        type: "ADMIN" as any,
        actionUrl: "/admin/listings"
      }));
      
      await prisma.notification.createMany({
        data: notificationsData,
      });
    }

    return NextResponse.json(
      { success: true, message: "Listing created successfully", data: listing },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating listing:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create listing" },
      { status: 500 }
    );
  }
}
