import { prisma } from "@/lib/prisma";

export function isNumericFragment(content: string): boolean {
  if (!content) return false;
  
  // Must contain at least one digit
  if (!/\d/.test(content)) return false;

  // Must ONLY contain digits, spaces, and newlines (no letters, no other symbols)
  if (!/^[\d\s\n]+$/.test(content)) return false;

  return true;
}

export async function detectMultiMessagePhone(conversationId: string, senderId: string, currentContent: string) {
  if (!isNumericFragment(currentContent)) {
    return { isContactSharing: false, fragmentMessageIds: [] };
  }

  // Fetch recent messages
  const recentMessages = await prisma.message.findMany({
    where: {
      conversationId,
      senderId,
      createdAt: {
        gte: new Date(Date.now() - 5 * 60 * 1000) // last 5 mins
      }
    },
    orderBy: { createdAt: "desc" },
    take: 20
  });

  const fragmentIds: string[] = [];
  let combinedDigits = currentContent.replace(/[^\d]/g, '');

  for (const msg of recentMessages) {
    if (isNumericFragment(msg.content)) {
      fragmentIds.push(msg.id);
      combinedDigits = msg.content.replace(/[^\d]/g, '') + combinedDigits;
      
      if (combinedDigits.length >= 10 && combinedDigits.length <= 15) {
        return { isContactSharing: true, fragmentMessageIds: fragmentIds };
      }
    } else {
      // Break the chain if a non-fragment message is encountered
      break;
    }
  }

  return { isContactSharing: false, fragmentMessageIds: [] };
}

export async function maskConversationDigits(messageIds: string[]) {
  if (messageIds.length === 0) return;
  
  await prisma.message.updateMany({
    where: {
      id: { in: messageIds }
    },
    data: {
      isMasked: true,
      maskedReason: "CONTACT_SHARING"
    }
  });
}

export async function createContactWarning(conversationId: string, senderId: string) {
  // Check if a warning was already sent in the last 30 minutes to prevent spam
  const recentWarning = await prisma.message.findFirst({
    where: {
      conversationId,
      content: "⚠ Contact information has been hidden to protect both users.",
      createdAt: {
        gte: new Date(Date.now() - 30 * 60 * 1000)
      }
    }
  });

  if (recentWarning) return null;

  const warningMsg = await prisma.message.create({
    data: {
      conversationId,
      senderId,
      content: "⚠ Contact information has been hidden to protect both users.",
      messageType: "TEXT",
    }
  });

  return warningMsg;
}
