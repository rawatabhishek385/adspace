import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const requestSchema = z.object({
  influencerId: z.string(),
  title: z.string().min(3),
  description: z.string().min(10),
  budget: z.number().nullable(),
  timeline: z.string().nullable(),
  timelineDays: z.number().min(1).default(1),
  campaignType: z.enum(["INFLUENCER", "DIGITAL_MARKETING"]),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = requestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { influencerId, title, description, budget, timeline, timelineDays, campaignType } = result.data;

    // Fetch the influencer profile
    const influencer = await prisma.influencerProfile.findUnique({
      where: { id: influencerId },
      include: { user: true },
    });

    if (!influencer) {
      return NextResponse.json({ error: "Influencer not found" }, { status: 404 });
    }

    if (influencer.status !== "APPROVED") {
      return NextResponse.json({ error: "Influencer profile is not approved" }, { status: 400 });
    }

    if (influencer.userId === session.user.id) {
      return NextResponse.json({ error: "Cannot send a request to yourself" }, { status: 400 });
    }

    // Prevent duplicate pending requests from the same user to the same influencer
    const existingPending = await prisma.campaignRequest.findFirst({
      where: {
        requesterId: session.user.id,
        influencerProfileId: influencerId,
        status: "PENDING",
      },
    });

    if (existingPending) {
      return NextResponse.json({ error: "You already have a pending campaign request with this influencer." }, { status: 400 });
    }

    const campaignRequest = await prisma.campaignRequest.create({
      data: {
        requesterId: session.user.id,
        influencerProfileId: influencerId,
        title,
        description,
        budget,
        timeline,
        timelineDays,
        campaignType,
        status: "PENDING",
      },
    });

    // Notify the influencer
    await prisma.notification.create({
      data: {
        userId: influencer.userId,
        type: "SYSTEM",
        title: "New Campaign Request",
        message: `You have received a new campaign request from ${session.user.name}: "${title}"`,
        actionUrl: "/dashboard/campaigns",
      },
    });

    // We could emit a socket event here if we had access to the IO instance directly,
    // but the client usually fetches notifications on load. For real-time, the socket server
    // would need to be pinged, which is handled in the Notification component typically polling
    // or via an internal API.

    return NextResponse.json(campaignRequest, { status: 201 });
  } catch (error) {
    console.error("Error creating campaign request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
