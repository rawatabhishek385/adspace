import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const resolvedParams = await searchParams;
  const token = resolvedParams.token;

  if (!token) {
    return <VerificationCard status="invalid" message="Invalid verification token." />;
  }

  const user = await prisma.user.findUnique({
    where: { emailVerificationToken: token },
  });

  if (!user) {
    return <VerificationCard status="invalid" message="Invalid verification token." />;
  }

  if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
    return (
      <VerificationCard 
        status="expired" 
        message="Verification link expired. Please request a new verification email from the login page." 
      />
    );
  }

  // Success
  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
    },
  });

  return (
    <VerificationCard 
      status="success" 
      message="Email verified successfully. You can now log in to your account." 
    />
  );
}

function VerificationCard({ status, message }: { status: "success" | "invalid" | "expired", message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50/30 px-4">
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-sm rounded-2xl p-8 shadow-xl text-center">
        {status === "success" && (
          <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        {status === "invalid" && (
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}
        {status === "expired" && (
          <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
        
        <h2 className="text-2xl font-bold text-white mb-3">
          {status === "success" ? "Verified!" : status === "invalid" ? "Invalid Token" : "Link Expired"}
        </h2>
        <p className="text-slate-500 mb-8 leading-relaxed">
          {message}
        </p>

        <Link
          href="/login"
          className="inline-block w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-slate-700 font-medium rounded-lg transition-all"
        >
          {status === "success" ? "Continue to Login" : "Go to Login"}
        </Link>
      </div>
    </div>
  );
}
