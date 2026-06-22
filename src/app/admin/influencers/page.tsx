import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { redirect } from "next/navigation";
import InfluencerRequestsTable from "./InfluencerRequestsTable";

export default async function AdminInfluencersPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const requests = await prisma.influencerProfile.findMany({
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Influencer Requests</h1>
          <p className="text-slate-500 text-sm mt-1">Review and approve applications to become an Influencer or Digital Marketer.</p>
        </div>
      </div>

      <InfluencerRequestsTable initialRequests={requests} />
    </div>
  );
}
