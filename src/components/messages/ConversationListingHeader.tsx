import Image from "next/image";
import Link from "next/link";

export interface ConversationListing {
  id: string;
  title: string;
  isActive: boolean;
  city: string;
  country: string;
  price: number;
  pricePeriod: string;
  media: { url: string; type: string }[];
}

export default function ConversationListingHeader({ listing }: { listing: ConversationListing }) {
  const thumbnail = listing.media?.[0]?.url;

  return (
    <div className="bg-slate-50 border-b border-slate-200 p-3 sm:p-4 shrink-0">
      <div className="max-w-4xl mx-auto flex flex-wrap gap-3 sm:gap-4 items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-[240px]">
          {/* Thumbnail */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden shrink-0 bg-white border border-slate-100">
            {thumbnail ? (
              <Image 
                src={thumbnail} 
                alt={listing.title} 
                fill 
                className="object-cover"
                sizes="(max-width: 640px) 64px, 80px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-slate-800 font-semibold text-lg truncate leading-tight mb-1">
              {listing.title}
            </h3>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm mt-1">
              <span className="text-blue-600 font-bold whitespace-nowrap bg-blue-50 px-2 py-0.5 rounded-md">
                ₹{listing.price.toLocaleString("en-IN")} / {listing.pricePeriod}
              </span>
              <span className="text-slate-500 truncate flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {listing.city}, {listing.country}
              </span>
              <span className="text-slate-400 text-xs px-2 py-0.5 bg-slate-100 rounded-md">
                ID: {listing.id.substring(0, 8)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="w-full sm:w-auto shrink-0 flex items-center">
          <Link 
            href={`/listings/${listing.id}`}
            className="w-full sm:w-auto text-center px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-lg border border-slate-200 transition-colors text-sm font-medium whitespace-nowrap"
          >
            View Listing
          </Link>
        </div>
      </div>
    </div>
  );
}
