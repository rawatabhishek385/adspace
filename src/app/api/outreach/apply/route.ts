import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { InfluencerType } from "@prisma/client";

const applySchema = z.object({
  type: z.enum(["INDIVIDUAL", "DIGITAL_MARKETER"]),
  companyName: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  followers: z.number().optional(),
  profileImage: z.string().optional(),
  instagramUrl: z.string().optional(),
  youtubeUrl: z.string().optional(),
  twitterUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
  facebookUrl: z.string().optional(),
}).refine((data) => {
  if (data.type === "DIGITAL_MARKETER" && (!data.companyName || data.companyName.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Company Name is required for Digital Marketers.",
  path: ["companyName"],
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = applySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const data = result.data;

    const existingProfile = await prisma.influencerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (existingProfile) {
      return NextResponse.json(
        { success: false, message: "You have already applied." },
        { status: 400 }
      );
    }

    const profile = await prisma.influencerProfile.create({
      data: {
        userId: session.user.id,
        type: data.type as InfluencerType,
        companyName: data.companyName?.trim() || null,
        description: data.description?.trim() || null,
        category: data.category?.trim() || null,
        city: data.city?.trim() || null,
        followers: data.followers || null,
        profileImage: data.profileImage?.trim() || null,
        instagramUrl: data.instagramUrl?.trim() || null,
        youtubeUrl: data.youtubeUrl?.trim() || null,
        twitterUrl: data.twitterUrl?.trim() || null,
        linkedinUrl: data.linkedinUrl?.trim() || null,
        facebookUrl: data.facebookUrl?.trim() || null,
        status: "PENDING",
      },
    });

    // Notify admins
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    if (admins.length > 0) {
      const notificationsData = admins.map(admin => ({
        userId: admin.id,
        title: "New Influencer Application",
        message: `A user has applied to become an influencer (${data.type}).`,
        type: "ADMIN" as any,
        actionUrl: "/admin/influencers"
      }));
      
      await prisma.notification.createMany({
        data: notificationsData,
      });
    }

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error("Apply Influencer Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
