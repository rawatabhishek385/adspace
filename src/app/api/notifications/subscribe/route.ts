import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await req.json();

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ success: false, error: "Invalid subscription data" }, { status: 400 });
    }

    // Save or update subscription in DB
    // We match by endpoint so we don't have duplicates for the same browser
    const existingSub = await prisma.pushSubscription.findFirst({
      where: { endpoint: subscription.endpoint, userId: session.user.id }
    });

    if (existingSub) {
      await prisma.pushSubscription.update({
        where: { id: existingSub.id },
        data: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        }
      });
    } else {
      await prisma.pushSubscription.create({
        data: {
          userId: session.user.id,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save subscription" },
      { status: 500 }
    );
  }
}
