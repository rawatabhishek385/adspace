import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function DashboardReviewsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  const reviewsReceived = await prisma.review.findMany({
    where: { revieweeId: userId, isDeleted: false },
    include: { reviewer: { select: { name: true, avatar: true } } },
    orderBy: { createdAt: "desc" },
  });

  const reviewsGiven = await prisma.review.findMany({
    where: { reviewerId: userId, isDeleted: false },
    include: { reviewee: { select: { name: true, avatar: true } } },
    orderBy: { createdAt: "desc" },
  });

  const activeTotalReviews = reviewsReceived.length;
  const activeAverageRating = activeTotalReviews > 0
    ? reviewsReceived.reduce((sum, r) => sum + r.rating, 0) / activeTotalReviews
    : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-white mb-6">My Reputation & Reviews</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-center items-center text-center">
          <p className="text-4xl font-bold text-amber-500 mb-2">{activeAverageRating.toFixed(1)}</p>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Average Rating</p>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-center items-center text-center">
          <p className="text-4xl font-bold text-blue-500 mb-2">{activeTotalReviews}</p>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Reviews</p>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-center items-center text-center">
          <p className="text-4xl font-bold text-blue-500 mb-2">{reviewsGiven.length}</p>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Reviews Given</p>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white border-b border-slate-200 pb-4">Received Reviews</h2>
        {reviewsReceived.length > 0 ? (
          <div className="space-y-4">
            {reviewsReceived.map((review) => (
              <div key={review.id} className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-white overflow-hidden flex items-center justify-center shrink-0">
                    {review.reviewer.avatar ? (
                      <Image src={review.reviewer.avatar} alt={review.reviewer.name} width={40} height={40} className="object-cover w-full h-full" />
                    ) : (
                      <span className="text-sm font-semibold text-slate-500">{review.reviewer.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">{review.reviewer.name}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex text-amber-500">
                        {[1, 2, 3, 4, 5].map(star => (
                          <svg key={star} className={`w-3 h-3 ${star <= review.rating ? 'text-amber-500' : 'text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-xs text-slate-500">{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(review.createdAt)}</span>
                    </div>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-slate-600 text-sm ml-13">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 bg-white border border-slate-100 rounded-xl p-8 text-center">You have not received any reviews yet.</p>
        )}
      </div>

      <div className="space-y-6 pt-8">
        <h2 className="text-xl font-bold text-white border-b border-slate-200 pb-4">Given Reviews</h2>
        {reviewsGiven.length > 0 ? (
          <div className="space-y-4">
            {reviewsGiven.map((review) => (
              <div key={review.id} className="bg-slate-500 border border-slate-100 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-white overflow-hidden flex items-center justify-center shrink-0 opacity-80">
                    {review.reviewee.avatar ? (
                      <Image src={review.reviewee.avatar} alt={review.reviewee.name} width={40} height={40} className="object-cover w-full h-full" />
                    ) : (
                      <span className="text-sm font-semibold text-slate-500">{review.reviewee.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">To: {review.reviewee.name}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex text-amber-500">
                        {[1, 2, 3, 4, 5].map(star => (
                          <svg key={star} className={`w-3 h-3 ${star <= review.rating ? 'text-amber-500' : 'text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-xs text-slate-500">{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(review.createdAt)}</span>
                    </div>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-slate-500 text-sm ml-13">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-500 bg-white border border-slate-100 rounded-xl p-8 text-center">You have not written any reviews yet.</p>
        )}
      </div>

    </div>
  );
}
