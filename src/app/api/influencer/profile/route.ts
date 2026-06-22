import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const profile = await prisma.influencerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true, status: true, type: true },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, message: "No influencer profile" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error("Error checking influencer profile:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      description,
      category,
      city,
      pricePerPost,
      profileImage,
      instagramUrl,
      youtubeUrl,
      twitterUrl,
      linkedinUrl,
      facebookUrl,
    } = body;

    // Check if influencer profile exists
    const influencer = await prisma.influencerProfile.findUnique({
      where: { userId: session.user.id }
    });

    if (!influencer) {
      return NextResponse.json(
        { success: false, message: "Influencer profile not found" },
        { status: 404 }
      );
    }

    // Update profile
    const updatedProfile = await prisma.influencerProfile.update({
      where: { userId: session.user.id },
      data: {
        description: description?.trim() || null,
        category: category?.trim() || null,
        city: city?.trim() || null,
        pricePerPost: pricePerPost ? parseFloat(pricePerPost) : null,
        profileImage: profileImage || null,
        instagramUrl: instagramUrl?.trim() || null,
        youtubeUrl: youtubeUrl?.trim() || null,
        twitterUrl: twitterUrl?.trim() || null,
        linkedinUrl: linkedinUrl?.trim() || null,
        facebookUrl: facebookUrl?.trim() || null,
      }
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedProfile
    });

  } catch (error) {
    console.error("Error updating influencer profile:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred while updating profile" },
      { status: 500 }
    );
  }
}
