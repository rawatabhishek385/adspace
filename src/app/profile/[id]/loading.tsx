export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header Skeleton */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="h-32 bg-slate-200 w-full" />
          <div className="px-8 pb-8">
            <div className="relative flex justify-between items-end -mt-12 mb-6">
              <div className="w-24 h-24 rounded-full border-4 border-white bg-slate-300" />
              <div className="h-10 w-32 bg-slate-200 rounded-xl" />
            </div>
            <div className="space-y-4">
              <div className="h-8 w-48 bg-slate-200 rounded-lg" />
              <div className="h-4 w-64 bg-slate-200 rounded" />
              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <div className="h-6 w-24 bg-slate-200 rounded" />
                <div className="h-6 w-24 bg-slate-200 rounded" />
                <div className="h-6 w-24 bg-slate-200 rounded" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Skeleton */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl p-8 border border-slate-200">
              <div className="h-6 w-48 bg-slate-200 rounded mb-6" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-48 bg-slate-100 rounded-2xl" />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-6 border border-slate-200">
              <div className="h-6 w-32 bg-slate-200 rounded mb-4" />
              <div className="space-y-3">
                <div className="h-4 w-full bg-slate-100 rounded" />
                <div className="h-4 w-3/4 bg-slate-100 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
