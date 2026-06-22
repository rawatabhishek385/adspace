import ListingSkeletons from "@/components/listings/ListingSkeletons";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-8 w-64 bg-white rounded animate-pulse mb-4" />
          <div className="h-4 w-96 bg-white rounded animate-pulse mb-6" />
          
          {/* SearchBar Skeleton */}
          <div className="h-14 w-full bg-white rounded-2xl animate-pulse" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Sidebar Skeleton */}
          <div className="lg:col-span-1">
            <div className="h-96 w-full bg-white rounded-2xl animate-pulse" />
          </div>

          {/* Main Content Area Skeleton */}
          <div className="lg:col-span-3">
            <ListingSkeletons count={6} />
          </div>
          
        </div>
      </div>
    </div>
  );
}
