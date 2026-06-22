import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default async function BrandCampaignsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const campaigns = await prisma.campaignRequest.findMany({
    where: { requesterId: session.user.id },
    include: { influencerProfile: { include: { user: { select: { id: true, name: true, avatar: true } } } } },
    orderBy: { createdAt: "desc" }
  });

  const pending = campaigns.filter(c => c.status === "PENDING");
  const active = campaigns.filter(c => c.status === "ACCEPTED" || c.status === "IN_PROGRESS");
  const completed = campaigns.filter(c => c.status === "COMPLETED");
  const others = campaigns.filter(c => c.status === "REJECTED" || c.status === "CANCELLED");

  const renderCard = (campaign: any) => (
    <div key={campaign.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-bold text-slate-800 text-lg line-clamp-1">{campaign.title}</h3>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
          campaign.status === "PENDING" ? "bg-amber-100 text-amber-700" :
          campaign.status === "ACCEPTED" ? "bg-blue-100 text-blue-700" :
          campaign.status === "REJECTED" || campaign.status === "CANCELLED" ? "bg-red-100 text-red-700" :
          "bg-emerald-100 text-emerald-700"
        }`}>
          {campaign.status}
        </span>
      </div>
      
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden">
          {campaign.influencerProfile.user.avatar ? (
            <img src={campaign.influencerProfile.user.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-500">
              {campaign.influencerProfile.user.name[0]}
            </span>
          )}
        </div>
        <span className="text-sm font-medium text-slate-600">To: {campaign.influencerProfile.user.name}</span>
        <span className="text-slate-300 mx-1">•</span>
        <span className="text-xs text-slate-500">{formatDistanceToNow(new Date(campaign.createdAt), { addSuffix: true })}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-50 p-2 rounded-lg">
          <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Budget</p>
          <p className="text-sm font-semibold text-slate-700">{campaign.budget ? `₹${campaign.budget.toLocaleString()}` : "Negotiable"}</p>
        </div>
        <div className="bg-slate-50 p-2 rounded-lg">
          <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Timeline</p>
          <p className="text-sm font-semibold text-slate-700">{campaign.timeline || "Flexible"}</p>
        </div>
      </div>

      <Link 
        href={`/dashboard/campaigns/${campaign.id}`}
        className="block w-full text-center py-2 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 font-medium rounded-xl transition-colors border border-slate-200 hover:border-indigo-200"
      >
        View Details
      </Link>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">My Campaign Requests</h1>
        <p className="text-slate-600">Track the proposals you've sent to influencers.</p>
      </div>

      <div className="space-y-10">
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            Active Campaigns
            {active.length > 0 && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">{active.length}</span>}
          </h2>
          {active.length === 0 ? (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center text-slate-500">
              No active campaigns.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {active.map(renderCard)}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            Pending Requests
            {pending.length > 0 && <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">{pending.length}</span>}
          </h2>
          {pending.length === 0 ? (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 text-center text-slate-500">
              No pending campaign requests.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pending.map(renderCard)}
            </div>
          )}
        </section>

        {completed.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-4">Completed</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
              {completed.map(renderCard)}
            </div>
          </section>
        )}

        {others.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-4">Rejected / Cancelled</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
              {others.map(renderCard)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
