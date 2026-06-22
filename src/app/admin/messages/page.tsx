import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const conversations = await prisma.conversation.findMany({
    include: {
      listing: { select: { id: true, title: true } },
      buyer: { select: { id: true, name: true, email: true } },
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Platform Conversations</h1>
          <p className="text-slate-500">Monitor messages between buyers and owners across the platform.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border shadow-sm">
          <span className="text-sm text-slate-500">Total Conversations: </span>
          <span className="font-bold text-slate-800">{conversations.length}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b">
              <tr>
                <th className="px-6 py-4">Listing & Subject</th>
                <th className="px-6 py-4">Buyer</th>
                <th className="px-6 py-4">Owner</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Messages</th>
                <th className="px-6 py-4">Last Active</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {conversations.map((conv) => (
                <tr key={conv.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-800 truncate max-w-[200px]">{conv.listing?.title || "Listing unavailable"}</p>
                    <p className="text-xs text-slate-500 truncate max-w-[200px]">{conv.subject || "No Subject"}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-800">{conv.buyer.name}</p>
                    <p className="text-xs text-slate-500">{conv.buyer.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-800">{conv.owner.name}</p>
                    <p className="text-xs text-slate-500">{conv.owner.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        conv.status === "ACTIVE"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {conv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-600">
                      {conv._count.messages}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/messages/${conv.id}`}
                      className="text-indigo-600 hover:text-indigo-900 font-medium"
                    >
                      View Thread
                    </Link>
                  </td>
                </tr>
              ))}
              {conversations.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    No conversations found on the platform yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
