import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ApplyForm from "./ApplyForm";
import Link from "next/link";

export default async function OutreachApplyPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/outreach/apply");
  }

  const profile = await prisma.influencerProfile.findUnique({
    where: { userId: session.user.id }
  });

  if (profile) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
          <div className="mb-6">
            {profile.status === "PENDING" && (
              <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
            {profile.status === "APPROVED" && (
              <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {profile.status === "REJECTED" && (
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Application Status</h2>
          <h3 className="text-lg font-medium text-slate-600 mb-4">{profile.status}</h3>
          <p className="text-slate-500 mb-8 leading-relaxed">
            {profile.status === "PENDING" && "Your application is currently under review by our team. We'll notify you once a decision has been made."}
            {profile.status === "APPROVED" && "Congratulations! Your influencer profile has been approved and is now public."}
            {profile.status === "REJECTED" && "Unfortunately, your application was not approved at this time. Please contact support if you have questions."}
          </p>
          <Link href="/dashboard" className="inline-block w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-all">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Become an Influencer</h1>
          <p className="mt-2 text-slate-600">Join our network of creators and digital marketers.</p>
        </div>
        <ApplyForm />
      </div>
    </div>
  );
}
