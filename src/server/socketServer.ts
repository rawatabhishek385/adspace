import { createServer } from "http";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const port = parseInt(process.env.SOCKET_PORT || "3001", 10);

const httpServer = createServer((req, res) => {
  // Allow internal API routes to check presence
  if (req.url && req.url.startsWith('/api/presence') && req.method === 'GET') {
    try {
      const url = new URL(req.url, `http://127.0.0.1:${port}`);
      const userId = url.searchParams.get('userId');
      if (userId) {
        const isOnline = onlineUsers.has(userId) && onlineUsers.get(userId)!.size > 0;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ isOnline }));
        return;
      }
    } catch (e) {}
  }
  
  res.writeHead(404);
  res.end();
});

const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXTAUTH_URL || "http://127.0.0.1:3000",
    methods: ["GET", "POST"],
  },
});

// Map<userId, Set<socketId>> to track online users and their connections
const onlineUsers = new Map<string, Set<string>>();

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  let currentUserId: string | null = null;

  socket.on("userOnline", async (userId: string) => {
    // If this socket was already associated with a different user (e.g. they logged out and logged in as someone else in the same tab), clean up the old user
    if (currentUserId && currentUserId !== userId) {
      if (onlineUsers.has(currentUserId)) {
        onlineUsers.get(currentUserId)!.delete(socket.id);
        if (onlineUsers.get(currentUserId)!.size === 0) {
          onlineUsers.delete(currentUserId);
          io.emit("presenceUpdate", { userId: currentUserId, isOnline: false, lastSeen: new Date() });
        }
      }
    }

    currentUserId = userId;
    
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);

    console.log(`User ${userId} online. Total sockets: ${onlineUsers.get(userId)!.size}`);

    // Broadcast presence update to everyone (or could optimize to only broadcast to relevant rooms)
    io.emit("presenceUpdate", { userId, isOnline: true });
  });

  socket.on("joinConversation", (conversationId: string) => {
    socket.join(`conversation:${conversationId}`);
    console.log(`Socket ${socket.id} joined conversation:${conversationId}`);
  });

  socket.on("leaveConversation", (conversationId: string) => {
    socket.leave(`conversation:${conversationId}`);
    console.log(`Socket ${socket.id} left conversation:${conversationId}`);
  });

  socket.on("sendMessage", async (data: { 
    conversationId: string; 
    senderId: string; 
    content: string; 
    tempId: string;
    messageType?: "TEXT" | "IMAGE" | "FILE";
    imageUrl?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    replyToId?: string;
  }) => {
    try {
      const { conversationId, senderId, content, tempId, messageType, imageUrl, fileUrl, fileName, fileSize, replyToId } = data;

      // Ensure conversation exists and is active
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { status: true, buyerId: true, ownerId: true },
      });

      if (!conversation || conversation.status === "CLOSED") {
        return socket.emit("messageError", { tempId, error: "Conversation is closed or not found" });
      }

      // Check if the other user is currently online in the system
      const receiverId = conversation.buyerId === senderId ? conversation.ownerId : conversation.buyerId;
      const isReceiverOnline = onlineUsers.has(receiverId) && onlineUsers.get(receiverId)!.size > 0;

      // Save message to DB
      const newMessage = await prisma.message.create({
        data: {
          conversationId,
          senderId,
          content: content.trim(),
          messageType: messageType || "TEXT",
          imageUrl,
          fileUrl,
          fileName,
          fileSize,
          replyToId,
          isDelivered: isReceiverOnline, // Mark delivered if they have any active socket
          deliveredAt: isReceiverOnline ? new Date() : null,
        },
        include: {
          replyTo: { select: { id: true, content: true, senderId: true, messageType: true, fileName: true, isDeleted: true } }
        }
      });

      // Update conversation's updatedAt and lastMessageAt
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date(), lastMessageAt: new Date() },
      });

      // Emit back to sender to confirm (replace optimistic temp message)
      socket.emit("messageSentAck", { tempId, message: newMessage });

      // Broadcast to room (including sender's other tabs)
      socket.to(`conversation:${conversationId}`).emit("receiveMessage", newMessage);
      
      // Also broadcast to the receiver globally (for sidebar notifications if they are not in the chat room)
      if (onlineUsers.has(receiverId)) {
        onlineUsers.get(receiverId)!.forEach(socketId => {
          io.to(socketId).emit("newGlobalMessage", { conversationId, message: newMessage });
        });
      }

      // Auto-Reply Logic for Offline Receiver
      if (!isReceiverOnline) {
        const receiver = await prisma.user.findUnique({
          where: { id: receiverId },
          select: { autoReplyEnabled: true, autoReplyMessage: true },
        });

        if (receiver?.autoReplyEnabled && receiver.autoReplyMessage) {
          // Check if we already sent an auto-reply in the last 24 hours
          const lastAutoReply = await prisma.message.findFirst({
            where: {
              conversationId,
              senderId: receiverId,
              content: receiver.autoReplyMessage,
              createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            },
          });

          if (!lastAutoReply) {
            const autoReply = await prisma.message.create({
              data: {
                conversationId,
                senderId: receiverId,
                content: receiver.autoReplyMessage,
                messageType: "TEXT",
                isDelivered: true, // It's delivered to the sender's open socket
                deliveredAt: new Date(),
              },
            });

            // Update conversation again
            await prisma.conversation.update({
              where: { id: conversationId },
              data: { updatedAt: new Date(), lastMessageAt: new Date() },
            });

            // Send to the room so sender sees it immediately
            io.to(`conversation:${conversationId}`).emit("receiveMessage", autoReply);
          }
        }
      }

    } catch (error) {
      console.error("Error saving message:", error);
      socket.emit("messageError", { tempId: data.tempId, error: "Failed to send message" });
    }
  });

  socket.on("deleteMessage", async (data: { messageId: string; conversationId: string; userId: string }) => {
    try {
      const { messageId, conversationId, userId } = data;
      
      const message = await prisma.message.findUnique({ where: { id: messageId } });
      if (!message || message.senderId !== userId) return; // Only sender can delete

      // Check if within 15 minutes
      const diffMins = (new Date().getTime() - message.createdAt.getTime()) / (1000 * 60);
      if (diffMins > 15) {
        socket.emit("messageError", { error: "You can only delete messages within 15 minutes of sending." });
        return;
      }

      await prisma.message.update({
        where: { id: messageId },
        data: { isDeleted: true, deletedAt: new Date() },
      });

      io.to(`conversation:${conversationId}`).emit("messageDeleted", { messageId });
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  });

  socket.on("reactMessage", async (data: { messageId: string; conversationId: string; userId: string; emoji: string }) => {
    try {
      const { messageId, conversationId, userId, emoji } = data;

      // Check if reaction already exists
      const existing = await prisma.messageReaction.findUnique({
        where: {
          userId_messageId_emoji: { userId, messageId, emoji }
        }
      });

      if (existing) {
        // Remove it (toggle)
        await prisma.messageReaction.delete({ where: { id: existing.id } });
      } else {
        // Add it
        await prisma.messageReaction.create({
          data: { userId, messageId, emoji }
        });
      }

      // Fetch all reactions for this message to broadcast the updated state
      const updatedReactions = await prisma.messageReaction.findMany({
        where: { messageId },
        select: { id: true, emoji: true, userId: true },
      });

      io.to(`conversation:${conversationId}`).emit("messageReaction", { messageId, reactions: updatedReactions });
    } catch (error) {
      console.error("Error reacting to message:", error);
    }
  });

  socket.on("starMessage", async (data: { messageId: string; conversationId: string; userId: string }) => {
    try {
      const { messageId, conversationId, userId } = data;
      const message = await prisma.message.findUnique({ where: { id: messageId } });
      if (!message) return;

      const newStarredStatus = !message.isStarred;
      await prisma.message.update({
        where: { id: messageId },
        data: { isStarred: newStarredStatus },
      });

      io.to(`conversation:${conversationId}`).emit("messageStarred", { messageId, isStarred: newStarredStatus });
    } catch (error) {
      console.error("Error starring message:", error);
    }
  });

  socket.on("pinMessage", async (data: { messageId: string | null; conversationId: string; userId: string }) => {
    try {
      const { messageId, conversationId, userId } = data;
      
      const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
      if (!conversation || (conversation.buyerId !== userId && conversation.ownerId !== userId)) return;

      await prisma.conversation.update({
        where: { id: conversationId },
        data: { pinnedMessageId: messageId },
      });

      let pinnedMessage = null;
      if (messageId) {
        pinnedMessage = await prisma.message.findUnique({
          where: { id: messageId },
          include: { sender: { select: { name: true } } }
        });
      }

      io.to(`conversation:${conversationId}`).emit("messagePinned", { messageId, pinnedMessage });
    } catch (error) {
      console.error("Error pinning message:", error);
    }
  });

  socket.on("forwardMessage", async (data: { targetConversationId: string; senderId: string; content: string; messageType?: "TEXT" | "IMAGE" | "FILE"; imageUrl?: string; fileUrl?: string; fileName?: string; fileSize?: number; tempId: string }) => {
    try {
      const { targetConversationId, senderId, content, tempId, messageType, imageUrl, fileUrl, fileName, fileSize } = data;

      const conversation = await prisma.conversation.findUnique({
        where: { id: targetConversationId },
        select: { status: true, buyerId: true, ownerId: true },
      });

      if (!conversation || conversation.status === "CLOSED") {
        return socket.emit("messageError", { tempId, error: "Target conversation is closed or not found" });
      }

      const receiverId = conversation.buyerId === senderId ? conversation.ownerId : conversation.buyerId;
      const isReceiverOnline = onlineUsers.has(receiverId) && onlineUsers.get(receiverId)!.size > 0;

      const newMessage = await prisma.message.create({
        data: {
          conversationId: targetConversationId,
          senderId,
          content,
          messageType: messageType || "TEXT",
          imageUrl,
          fileUrl,
          fileName,
          fileSize,
          isDelivered: isReceiverOnline,
          deliveredAt: isReceiverOnline ? new Date() : null,
        },
        include: {
          replyTo: { select: { id: true, content: true, senderId: true, messageType: true, fileName: true, isDeleted: true } }
        }
      });

      await prisma.conversation.update({
        where: { id: targetConversationId },
        data: { updatedAt: new Date(), lastMessageAt: new Date() },
      });

      socket.emit("messageSentAck", { tempId, message: newMessage });
      socket.to(`conversation:${targetConversationId}`).emit("receiveMessage", newMessage);
      
      if (onlineUsers.has(receiverId)) {
        onlineUsers.get(receiverId)!.forEach(socketId => {
          io.to(socketId).emit("newGlobalMessage", { conversationId: targetConversationId, message: newMessage });
        });
      }
    } catch (error) {
      console.error("Error forwarding message:", error);
      socket.emit("messageError", { tempId: data.tempId, error: "Failed to forward message" });
    }
  });

  socket.on("markAsRead", async (data: { conversationId: string; readerId: string }) => {
    try {
      const { conversationId, readerId } = data;

      // Update DB for all messages sent to this reader in this conversation
      await prisma.message.updateMany({
        where: {
          conversationId,
          senderId: { not: readerId },
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      // Emit to the room that messages were read by this user
      io.to(`conversation:${conversationId}`).emit("messagesRead", {
        conversationId,
        readBy: readerId,
        readAt: new Date(),
      });
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  });

  socket.on("typing", (data: { conversationId: string; userId: string; name: string }) => {
    socket.to(`conversation:${data.conversationId}`).emit("userTyping", { userId: data.userId, name: data.name });
  });

  socket.on("stopTyping", (data: { conversationId: string; userId: string }) => {
    socket.to(`conversation:${data.conversationId}`).emit("userStoppedTyping", { userId: data.userId });
  });

  socket.on("checkPresence", async (userId: string) => {
    // Client asking for the current status of another user
    const isOnline = onlineUsers.has(userId) && onlineUsers.get(userId)!.size > 0;
    
    let lastSeen = null;
    if (!isOnline) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { lastSeen: true }
        });
        lastSeen = user?.lastSeen;
      } catch (err) {
        console.error("Failed to check presence in DB:", err);
      }
    }

    socket.emit("presenceUpdate", { userId, isOnline, lastSeen });
  });

  socket.on("disconnect", async () => {
    console.log(`Socket disconnected: ${socket.id}`);
    
    if (currentUserId && onlineUsers.has(currentUserId)) {
      const userSockets = onlineUsers.get(currentUserId)!;
      userSockets.delete(socket.id);

      if (userSockets.size === 0) {
        // User has closed all their tabs/sockets
        onlineUsers.delete(currentUserId);
        console.log(`User ${currentUserId} went offline.`);

        const lastSeen = new Date();
        
        // Update DB
        try {
          await prisma.user.update({
            where: { id: currentUserId },
            data: { lastSeen },
          });
        } catch (err) {
          console.error("Failed to update lastSeen:", err);
        }

        // Broadcast offline status
        io.emit("presenceUpdate", { userId: currentUserId, isOnline: false, lastSeen });
      }
    }
  });

  // ─── Phase D: Notification Center ─────────────────────────────────────────

  socket.on("markNotificationRead", async (data: { notificationId: string; userId: string }) => {
    try {
      const { notificationId, userId } = data;
      // Mark as read in DB
      const updatedNotification = await prisma.notification.updateMany({
        where: { id: notificationId, userId: userId },
        data: { isRead: true, openedAt: new Date() },
      });

      // Broadcast to other tabs of the same user
      if (onlineUsers.has(userId)) {
        onlineUsers.get(userId)!.forEach(socketId => {
          if (socketId !== socket.id) {
            io.to(socketId).emit("notificationReadSync", { notificationId });
          }
        });
      }
    } catch (error) {
      console.error("Error marking notification read:", error);
    }
  });

  socket.on("broadcastNotification", async (data: { userId: string; notification: any }) => {
    // This allows backend/admin to trigger a notification via socket
    const { userId, notification } = data;
    if (onlineUsers.has(userId)) {
      onlineUsers.get(userId)!.forEach(socketId => {
        io.to(socketId).emit("newNotification", notification);
      });
    }
  });
});

httpServer.listen(port, "127.0.0.1", () => {
  console.log(`> Socket.IO Server running on http://127.0.0.1:${port}`);
});
