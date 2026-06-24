import { MediaType } from "@prisma/client";

// ─── Listing Types ──────────────────────────────────────────────────────────

export interface CreateListingInput {
  title: string;
  description: string;
  categoryId: string;
  country: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  width?: number;
  height?: number;
  indoorOutdoor: "Indoor" | "Outdoor";
  digitalPhysical: "Digital" | "Physical";
  price: number;
  pricePeriod: "Hour" | "Day" | "Week" | "Month" | "Year";
  mediaUrls?: { url: string; publicId?: string; type: MediaType }[];
}

export interface ListingWithRelations {
  id: string;
  slug: string;
  title: string;
  description: string;
  country: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  width: number | null;
  height: number | null;
  indoorOutdoor: string;
  digitalPhysical: string;
  price: number;
  pricePeriod: string;
  averageRating: number;
  totalRatings: number;
  isActive: boolean;
  isFeatured: boolean;
  ownerId: string;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
  owner: {
    id: string;
    name: string;
    email?: string;
    phone?: string | null;
  };
  category: {
    id: string;
    name: string;
  };
  media: {
    id: string;
    url: string;
    publicId: string | null;
    type: MediaType;
  }[];
  _count?: {
    favorites: number;
  };
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
