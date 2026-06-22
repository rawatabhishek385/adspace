import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

interface AdminConversationPageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function AdminConversationPage({ params }: AdminConversationPageProps) {
  const resolvedParams = await params;
  
  const conversation = await prisma.conversation.findUnique({
    where: { id: resolvedParams.conversationId },
    include: {
      listing: { select: { id: true, title: true } },
      buyer: { select: { id: true, name: true, email: true } },
      owner: { select: { id: true, name: true, email: true } },
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!conversation) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link href="/admin/messages" className="text-slate-400 hover:text-slate-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-slate-800">Conversation Details</h1>
            </div>
            <p className="text-slate-500 ml-8">Read-only moderation view</p>
          </div>
          <span
            className={`px-3 py-1 text-xs font-bold rounded-full ${
              conversation.status === "ACTIVE"
                ? "bg-blue-100 text-blue-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {conversation.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-slate-50 rounded-lg border">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Subject</h3>
            <p className="font-medium text-slate-800">{conversation.subject || "No Subject"}</p>
            {conversation.listing ? (
              <Link href={`/listings/${conversation.listing.id}`} className="text-sm text-indigo-600 hover:underline mt-1 block">
                View Listing: {conversation.listing.title}
              </Link>
            ) : (
              <p className="text-sm text-slate-500 mt-1 block">Listing unavailable</p>
            )}
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Buyer</h3>
            <p className="font-medium text-slate-800">{conversation.buyer.name}</p>
            <p className="text-sm text-slate-600">{conversation.buyer.email}</p>
            <Link href={`/admin/users/${conversation.buyer.id}`} className="text-xs text-indigo-600 hover:underline mt-1 block">
              View User
            </Link>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg border">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Owner</h3>
            <p className="font-medium text-slate-800">{conversation.owner.name}</p>
            <p className="text-sm text-slate-600">{conversation.owner.email}</p>
            <Link href={`/admin/users/${conversation.owner.id}`} className="text-xs text-indigo-600 hover:underline mt-1 block">
              View User
            </Link>
          </div>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="bg-slate-100 p-6 rounded-xl shadow-inner border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 mb-6">Message History</h2>
        
        {conversation.messages.length === 0 ? (
          <p className="text-center text-slate-500 py-8">No messages in this conversation yet.</p>
        ) : (
          <div className="space-y-6">
            {conversation.messages.map((msg) => {
              const isBuyer = msg.senderId === conversation.buyerId;
              const sender = isBuyer ? conversation.buyer : conversation.owner;
              const roleLabel = isBuyer ? "Buyer" : "Owner";

              return (
                <div key={msg.id} className={`flex flex-col ${isBuyer ? "items-start" : "items-end"}`}>
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-xs font-semibold text-slate-600">{sender.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${isBuyer ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                      {roleLabel}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm ${
                      msg.isDeleted ? "bg-slate-200 text-slate-500 italic" : "bg-white text-slate-800 border"
                    } ${isBuyer ? "rounded-tl-none" : "rounded-tr-none"}`}
                  >
                    {msg.isDeleted ? "[This message was deleted]" : msg.content}
                  </div>
                  <div className="flex items-center gap-2 mt-1 px-1 text-[10px]">
                    <span className={msg.isRead ? "text-blue-500" : "text-slate-400"}>
                      {msg.isRead ? "Read" : "Unread"}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-400 font-mono">ID: {msg.id}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
