"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 text-center">
      <div className="bg-slate-50 border border-slate-200 p-8 rounded-2xl max-w-md w-full backdrop-blur-xl">
        <svg className="w-16 h-16 text-red-500 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="text-2xl font-bold text-white mb-2">Something went wrong!</h2>
        <p className="text-slate-500 mb-8 text-sm">
          We encountered an unexpected error. Please try again or return to the homepage.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full bg-blue-500 hover:bg-blue-600 text-slate-700 font-medium py-3 px-4 rounded-xl transition-colors"
          >
            Try Again
          </button>
          <Link href="/" className="w-full bg-white hover:bg-slate-700 text-slate-700 font-medium py-3 px-4 rounded-xl transition-colors">
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
