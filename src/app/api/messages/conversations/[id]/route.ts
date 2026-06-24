import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const conversationId = resolvedParams.id;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { ownerId: true, buyerId: true },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    if (conversation.ownerId !== session.user.id && conversation.buyerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete all related records first, then the conversation
    await prisma.$transaction([
      prisma.messageReaction.deleteMany({
        where: { message: { conversationId } },
      }),
      prisma.messageHide.deleteMany({
        where: { message: { conversationId } },
      }),
      prisma.message.deleteMany({
        where: { conversationId },
      }),
      prisma.pinnedConversation.deleteMany({
        where: { conversationId },
      }),
      prisma.review.deleteMany({
        where: { conversationId },
      }),
      prisma.conversation.delete({
        where: { id: conversationId },
      }),
    ]);

    return NextResponse.json({ success: true, message: "Conversation deleted successfully" });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
