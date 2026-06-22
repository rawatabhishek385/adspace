import Link from "next/link";
import Image from "next/image";
import type { ListingWithRelations } from "@/types/listing.types";
import { FavoriteButton } from "./FavoriteButton";
import DistanceBadge from "@/components/location/DistanceBadge";

interface ListingCardProps {
  listing: ListingWithRelations;
  showActions?: boolean;
  onDelete?: (id: string) => void;
  isFavorited?: boolean;
  distance?: number;
  distanceText?: string;
}

export function ListingCard({ listing, showActions, onDelete, isFavorited = false, distance, distanceText }: ListingCardProps) {
  const imageThumbnail = listing.media.find((m) => m.type === "IMAGE")?.url;
  const videoThumbnail = listing.media.find((m) => m.type === "VIDEO")?.url;

  return (
    <div className="group relative bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-blue-300 hover:scale-[1.03] transition-all duration-300">
      {/* Image */}
      <Link href={`/listings/${listing.slug}`}>
        <div className="relative h-48 bg-slate-100 overflow-hidden">
          {videoThumbnail ? (
            <video
              src={videoThumbnail}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : imageThumbnail ? (
            <Image
              src={imageThumbnail}
              alt={listing.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {/* Category Badge */}
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm text-xs font-medium text-blue-400 rounded-full">
            {listing.category.name}
          </span>
          {/* Status Badge */}
          {!listing.isActive && (
            <span className="absolute top-3 right-3 px-2.5 py-1 bg-red-500/80 text-xs font-medium text-white rounded-full">
              Inactive
            </span>
          )}
          {listing.isFeatured && listing.isActive && (
            <span className="absolute top-3 right-3 px-2.5 py-1 bg-amber-500/80 text-xs font-medium text-white rounded-full z-10">
              ⭐ Featured
            </span>
          )}
          {/* Distance Badge */}
          {distance !== undefined && distanceText && (
            <div className="absolute bottom-3 left-3 z-10">
              <DistanceBadge distance={distance} distanceText={distanceText} />
            </div>
          )}
        </div>
      </Link>
      
      {/* Favorite Button (Absolute over the image) */}
      <div className={`absolute top-3 right-3 z-20 ${listing.isFeatured && listing.isActive ? 'mt-8' : ''}`}>
        <FavoriteButton listingId={listing.id} initialIsFavorited={isFavorited} />
      </div>

      {/* Content */}
      <div className="p-4">
        <Link href={`/listings/${listing.slug}`}>
          <h3 className="text-slate-800 font-semibold truncate hover:text-blue-500 transition-colors">
            {listing.title}
          </h3>
        </Link>

        <div className="flex items-center gap-1.5 mt-1.5">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg 
                key={star} 
                className={`w-3.5 h-3.5 ${star <= Math.round(listing.averageRating || 0) ? 'text-amber-400' : 'text-slate-300'}`} 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            {listing.totalRatings > 0 && (
              <span className="ml-1.5 text-xs font-bold text-slate-700">{listing.averageRating.toFixed(1)}</span>
            )}
          </div>
          <span className="text-xs text-slate-500">
            {listing.totalRatings > 0 ? `(${listing.totalRatings})` : "(No reviews)"}
          </span>
          {listing._count && listing._count.favorites > 0 && (
            <>
              <span className="text-slate-300 mx-1">•</span>
              <span className="text-xs text-slate-400 font-medium">❤️ {listing._count.favorites} Saves</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 mt-1.5 text-sm text-slate-500">
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{listing.city}, {listing.country}</span>
        </div>

        <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-500">{listing.indoorOutdoor}</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-500">{listing.digitalPhysical}</span>
          {listing.width && listing.height && (
            <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-500">{listing.width}×{listing.height}</span>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
          <div>
            <span className="text-lg font-bold text-blue-500">₹{listing.price.toLocaleString("en-IN")}</span>
            <span className="text-xs text-slate-500 ml-1">/ {listing.pricePeriod}</span>
          </div>
          {showActions && onDelete && (
            <div className="flex gap-2">
              <Link
                href={`/dashboard/listings/${listing.id}/edit`}
                className="px-3 py-1 text-xs text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all"
              >
                Edit
              </Link>
              <button
                onClick={() => onDelete(listing.id)}
                className="px-3 py-1 text-xs text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
