import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { listingId } = await request.json();
    if (!listingId) {
      return NextResponse.json({ success: false, message: "Listing ID is required" }, { status: 400 });
    }

    const userId = session.user.id;

    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_listingId: {
          userId,
          listingId,
        },
      },
    });

    if (existingFavorite) {
      await prisma.favorite.delete({
        where: { id: existingFavorite.id },
      });
      return NextResponse.json({ success: true, message: "Listing removed from favorites", isFavorited: false });
    } else {
      await prisma.favorite.create({
        data: {
          userId,
          listingId,
        },
      });

      // Log FAVORITE activity for recommendations
      const listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: { categoryId: true, city: true },
      });

      if (listing) {
        await prisma.userActivity.create({
          data: {
            userId,
            listingId,
            actionType: "FAVORITE",
            categoryId: listing.categoryId,
            city: listing.city,
          },
        });
      }

      return NextResponse.json({ success: true, message: "Listing saved to favorites", isFavorited: true });
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: session.user.id },
      include: {
        listing: {
          select: {
            id: true,
            slug: true,
            title: true,
            price: true,
            pricePeriod: true,
            city: true,
            country: true,
            media: {
              select: {
                url: true,
                type: true,
              },
              where: { type: "IMAGE" },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const savedListings = favorites.map(fav => {
      const { listing } = fav;
      return {
        id: listing.id,
        slug: listing.slug,
        title: listing.title,
        price: listing.price,
        pricePeriod: listing.pricePeriod,
        city: listing.city,
        country: listing.country,
        imageUrl: listing.media[0]?.url || null,
        savedAt: fav.createdAt,
      };
    });

    return NextResponse.json({ success: true, data: savedListings });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
