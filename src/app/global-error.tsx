"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html>
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 text-center">
          <div className="bg-red-50 border border-red-200 p-8 rounded-2xl max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-4">Critical Platform Error</h2>
            <p className="text-slate-500 mb-6 text-sm">
              We encountered a critical error while trying to process your request. Our team has been notified.
            </p>
            <button
              onClick={() => reset()}
              className="w-full bg-blue-500 hover:bg-blue-600 text-slate-700 font-medium py-3 px-4 rounded-xl transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
