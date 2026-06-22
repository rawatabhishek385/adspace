import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default async function FavoritesDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const favorites = await prisma.favoriteInfluencer.findMany({
    where: { userId: session.user.id },
    include: {
      influencer: {
        include: {
          user: { select: { id: true, name: true, avatar: true } }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Saved Creators</h1>
        <p className="text-slate-600">Your favorite influencers and digital marketers.</p>
      </div>

      {favorites.length === 0 ? (
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-12 text-center text-slate-500">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-red-400">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">No saved creators yet</h2>
          <p className="mb-6">Browse outreach and save your favorite creators to quickly access them later.</p>
          <Link href="/outreach/browse" className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl shadow-sm hover:bg-indigo-700 transition-colors">
            Browse Creators
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map(({ influencer }) => (
            <Link key={influencer.id} href={`/profile/${influencer.userId}`} className="group bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all hover:border-indigo-200">
              <div className="relative w-16 h-16 mx-auto mb-4 rounded-full border-2 border-indigo-100 overflow-hidden bg-slate-100">
                {(influencer.profileImage || influencer.user.avatar) ? (
                  <Image src={(influencer.profileImage || influencer.user.avatar)!} alt={influencer.user.name} fill className="object-cover" />
                ) : (
                  <span className="flex items-center justify-center w-full h-full text-xl font-bold text-slate-400">
                    {influencer.user.name[0]}
                  </span>
                )}
                {influencer.availabilityStatus === 'AVAILABLE' && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              <div className="text-center">
                <h3 className="font-bold text-slate-800 text-lg line-clamp-1 group-hover:text-indigo-600 transition-colors">{influencer.companyName || influencer.user.name}</h3>
                <p className="text-sm text-slate-500 mb-3">{influencer.category || "Creator"}</p>
                <div className="flex items-center justify-center gap-1 text-amber-500 mb-4">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  <span className="font-bold text-slate-700">{influencer.rating.toFixed(1)}</span>
                  <span className="text-xs text-slate-400">({influencer.totalReviews})</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Followers</p>
                    <p className="font-semibold text-slate-700">{influencer.followers ? (influencer.followers >= 1000 ? `${(influencer.followers/1000).toFixed(1)}k` : influencer.followers) : '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Campaigns</p>
                    <p className="font-semibold text-slate-700">{influencer.totalCampaigns}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
