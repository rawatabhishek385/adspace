export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto py-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="h-10 w-64 bg-slate-200 rounded-lg mb-2"></div>
        <div className="h-5 w-48 bg-slate-200 rounded-lg"></div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 w-24 bg-slate-200 rounded"></div>
              <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
            </div>
            <div className="h-8 w-16 bg-slate-200 rounded mt-2"></div>
          </div>
        ))}
      </div>

      {/* Content Area Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 h-96">
            <div className="h-6 w-48 bg-slate-200 rounded mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 w-full bg-slate-100 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
        <div>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 h-96">
            <div className="h-6 w-32 bg-slate-200 rounded mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="h-12 w-12 bg-slate-100 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-slate-100 rounded"></div>
                    <div className="h-3 w-1/2 bg-slate-100 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
