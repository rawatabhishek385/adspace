import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const updateData: {
      name?: string;
      phone?: string;
      bio?: string;
      city?: string;
      state?: string;
      country?: string;
      website?: string;
      avatar?: string | null;
    } = {};

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.phone !== undefined) updateData.phone = body.phone.trim();
    if (body.bio !== undefined) updateData.bio = body.bio.trim();
    if (body.city !== undefined) updateData.city = body.city.trim();
    if (body.state !== undefined) updateData.state = body.state.trim();
    if (body.country !== undefined) updateData.country = body.country.trim();
    if (body.website !== undefined) updateData.website = body.website.trim();
    if (body.avatar !== undefined) updateData.avatar = body.avatar;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
