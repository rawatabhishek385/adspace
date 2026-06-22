import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 - Page Not Found | AdSpace",
};

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-white px-4 text-center">
      <div className="bg-slate-50 border border-slate-200 p-10 rounded-2xl max-w-md w-full backdrop-blur-xl">
        <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400 mb-4">
          404
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Page Not Found</h2>
        <p className="text-slate-500 mb-8 text-sm leading-relaxed">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/" className="inline-flex w-full justify-center bg-blue-500 hover:bg-blue-600 text-slate-700 font-medium py-3 px-4 rounded-xl transition-colors">
          Return to Homepage
        </Link>
      </div>
    </div>
  );
}
