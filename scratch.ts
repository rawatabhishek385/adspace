import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, name: true, autoReplyEnabled: true, autoReplyMessage: true }});
  console.log("Users:", users);

  const messages = await prisma.message.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, senderId: true, content: true, conversationId: true, createdAt: true }
  });
  console.log("Recent messages:", messages);
}

main().catch(console.error).finally(() => prisma.$disconnect());
