export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Hero Skeleton */}
      <section className="relative pt-12 pb-12 overflow-hidden bg-white min-h-[650px] flex items-center mb-16 animate-pulse">
        <div className="absolute inset-0 bg-slate-100"></div>
        <div className="max-w-7xl mx-auto w-full px-4 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="max-w-xl py-8 space-y-6">
            <div className="h-8 w-64 bg-slate-200 rounded-full mb-6"></div>
            <div className="h-16 w-3/4 bg-slate-200 rounded-lg"></div>
            <div className="h-16 w-full bg-slate-200 rounded-lg"></div>
            <div className="h-24 w-full bg-slate-200 rounded-lg mb-8"></div>
            <div className="flex gap-4">
              <div className="h-14 w-40 bg-slate-200 rounded-xl"></div>
              <div className="h-14 w-40 bg-slate-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Skeletons */}
      <section className="px-4 mb-20 max-w-7xl mx-auto w-full animate-pulse">
        <div className="h-8 w-64 bg-slate-200 rounded-full mb-8"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="h-48 bg-slate-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
                <div className="h-3 bg-slate-200 rounded w-1/3 mt-4" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
