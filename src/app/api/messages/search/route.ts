import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const query = searchParams.get('query');

    if (!conversationId || !query) {
      return NextResponse.json({ success: false, message: 'conversationId and query are required' }, { status: 400 });
    }

    // Verify user is part of the conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { ownerId: true, buyerId: true }
    });

    if (!conversation || (conversation.ownerId !== session.user.id && conversation.buyerId !== session.user.id)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    // Search messages
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        isDeleted: false, // Don't return globally deleted messages
        OR: [
          {
            content: {
              contains: query
            }
          },
          {
            fileName: {
              contains: query
            }
          }
        ]
      },
      include: {
        sender: {
          select: { name: true, avatar: true }
        },
        replyTo: {
          select: { id: true, content: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit results
    });

    // We also need to filter out messages the user has "Deleted for me"
    const hiddenMessages = await prisma.messageHide.findMany({
      where: {
        userId: session.user.id,
        messageId: { in: messages.map(m => m.id) }
      }
    });

    const hiddenMessageIds = new Set(hiddenMessages.map(h => h.messageId));
    const visibleMessages = messages.filter(m => !hiddenMessageIds.has(m.id));

    return NextResponse.json({ success: true, messages: visibleMessages });
  } catch (error) {
    console.error('Error searching messages:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
