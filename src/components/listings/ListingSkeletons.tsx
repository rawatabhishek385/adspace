export function ListingCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="h-48 bg-white w-full" />
      
      <div className="p-5">
        {/* Badges Skeleton */}
        <div className="flex gap-2 mb-3">
          <div className="h-5 w-16 bg-white rounded-full" />
          <div className="h-5 w-20 bg-white rounded-full" />
        </div>
        
        {/* Title Skeleton */}
        <div className="h-6 w-3/4 bg-white rounded mb-2" />
        
        {/* Location Skeleton */}
        <div className="h-4 w-1/2 bg-white rounded mb-4" />
        
        {/* Price & Footer Skeleton */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="h-6 w-1/3 bg-white rounded" />
          <div className="h-8 w-24 bg-white rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function ListingSkeletons({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}
