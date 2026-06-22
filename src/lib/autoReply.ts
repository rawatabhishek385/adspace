import { prisma } from "@/lib/prisma";

export async function processAutoReply(conversationId: string, senderId: string, receiverId: string) {
  try {
    // 1. Check if receiver is online
    let isReceiverOnline = false;
    try {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://127.0.0.1:3001";
      const res = await fetch(`${socketUrl}/api/presence?userId=${receiverId}`);
      if (res.ok) {
        const data = await res.json();
        isReceiverOnline = data.isOnline;
      }
    } catch (e) {
      console.error("Failed to check presence for auto-reply", e);
    }

    if (isReceiverOnline) return null;

    // 2. Fetch receiver's auto-reply settings
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { autoReplyEnabled: true, autoReplyMessage: true },
    });

    if (!receiver?.autoReplyEnabled || !receiver.autoReplyMessage) return null;

    // 3. Check if we already sent an auto-reply in the last 24 hours
    const lastAutoReply = await prisma.message.findFirst({
      where: {
        conversationId,
        senderId: receiverId,
        content: receiver.autoReplyMessage,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    if (lastAutoReply) return null;

    // 4. Create the auto reply message
    const autoReply = await prisma.message.create({
      data: {
        conversationId,
        senderId: receiverId,
        content: receiver.autoReplyMessage,
        messageType: "TEXT",
        isDelivered: true,
        deliveredAt: new Date(),
      },
    });

    // 5. Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date(), lastMessageAt: new Date() },
    });

    return autoReply;
  } catch (error) {
    console.error("Error processing auto reply:", error);
    return null;
  }
}
