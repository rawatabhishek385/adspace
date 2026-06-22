import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import DeleteReviewButton from "@/components/admin/DeleteReviewButton";

export default async function AdminReviewsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const allReviews = await prisma.review.findMany({
    include: {
      reviewer: { select: { id: true, name: true, avatar: true, email: true } },
      reviewee: { select: { id: true, name: true, avatar: true, email: true } },
      conversation: { select: { id: true, listing: { select: { title: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Review Moderation</h1>
          <p className="text-slate-500 text-sm">Monitor and moderate user reviews across the platform</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 text-sm">
            <span className="text-slate-500 mr-2">Total Reviews:</span>
            <span className="text-blue-500 font-bold">{allReviews.length}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 text-sm">
            <span className="text-slate-500 mr-2">Deleted:</span>
            <span className="text-red-500 font-bold">{allReviews.filter(r => r.isDeleted).length}</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="text-xs text-slate-500 bg-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Reviewer</th>
                <th className="px-6 py-4 font-medium">Reviewee</th>
                <th className="px-6 py-4 font-medium">Rating</th>
                <th className="px-6 py-4 font-medium">Comment</th>
                <th className="px-6 py-4 font-medium">Context</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allReviews.map((review) => (
                <tr key={review.id} className={`hover:bg-slate-50 transition-colors ${review.isDeleted ? 'opacity-50 bg-red-50' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Link href={`/profile/${review.reviewer.id}`} className="block w-8 h-8 rounded-full bg-white overflow-hidden flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity">
                        {review.reviewer.avatar ? (
                          <Image src={review.reviewer.avatar} alt={review.reviewer.name} width={32} height={32} className="object-cover w-full h-full" />
                        ) : (
                          <span className="text-xs font-semibold text-slate-500">{review.reviewer.name.charAt(0).toUpperCase()}</span>
                        )}
                      </Link>
                      <div>
                        <Link href={`/profile/${review.reviewer.id}`} className="font-medium text-white hover:text-blue-500 transition-colors">
                          {review.reviewer.name}
                        </Link>
                        <p className="text-xs text-slate-500">{review.reviewer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Link href={`/profile/${review.reviewee.id}`} className="block w-8 h-8 rounded-full bg-white overflow-hidden flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity">
                        {review.reviewee.avatar ? (
                          <Image src={review.reviewee.avatar} alt={review.reviewee.name} width={32} height={32} className="object-cover w-full h-full" />
                        ) : (
                          <span className="text-xs font-semibold text-slate-500">{review.reviewee.name.charAt(0).toUpperCase()}</span>
                        )}
                      </Link>
                      <div>
                        <Link href={`/profile/${review.reviewee.id}`} className="font-medium text-white hover:text-blue-500 transition-colors">
                          {review.reviewee.name}
                        </Link>
                        <p className="text-xs text-slate-500">{review.reviewee.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex text-amber-500">
                      {[1, 2, 3, 4, 5].map(star => (
                        <svg key={star} className={`w-4 h-4 ${star <= review.rating ? 'text-amber-500' : 'text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-slate-600 max-w-xs truncate" title={review.comment || ""}>
                      {review.comment || <span className="text-slate-600 italic">No comment</span>}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/dashboard/messages/${review.conversation.id}`} className="text-xs text-blue-500 hover:underline max-w-[150px] truncate block" title={review.conversation.listing?.title || "Listing unavailable"}>
                      {review.conversation.listing?.title || "Listing unavailable"}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    {review.isDeleted ? (
                      <span className="px-2 py-1 text-[10px] font-semibold bg-red-500/20 text-red-500 border border-red-200 rounded-md">Deleted</span>
                    ) : (
                      <span className="px-2 py-1 text-[10px] font-semibold bg-blue-100 text-blue-500 border border-blue-200 rounded-md">Active</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!review.isDeleted && (
                      <DeleteReviewButton reviewId={review.id} />
                    )}
                  </td>
                </tr>
              ))}
              {allReviews.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No reviews found in the system.
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
