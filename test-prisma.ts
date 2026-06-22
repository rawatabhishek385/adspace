import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function test() {
  try {
    const user = await prisma.user.findFirst();
    const conversation = await prisma.conversation.findFirst();
    
    if (!user || !conversation) {
      console.log("No user or conversation found");
      return;
    }

    const newMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: user.id,
        content: "Test message",
        messageType: "TEXT",
        isDelivered: false,
        deliveredAt: null,
      },
      include: {
        replyTo: { select: { id: true, content: true, senderId: true, messageType: true, fileName: true, isDeleted: true } }
      }
    });

    console.log("Message created successfully:", newMessage.id);
  } catch (error) {
    console.error("Prisma error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
